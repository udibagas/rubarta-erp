import { PrismaService } from './../prisma/prisma.service';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { ExpenseClaimDto } from './expense-claim.dto';
import {
  ApprovalStatus,
  ApprovalType,
  ClaimStatus,
  ExpenseClaim,
  ExpenseClaimApproval,
  Prisma,
} from '@prisma/client';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class ExpenseClaimsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly notification: NotificationsService,
  ) {}

  async create(expenseClaimDto: ExpenseClaimDto) {
    const {
      ExpenseClaimItem: items,
      ExpenseClaimAttachment: attachments,
      ...data
    } = expenseClaimDto;

    let number = 'DRAFT';

    if (data.status == ClaimStatus.SUBMITTED) {
      number = await this.generateNumber(data.companyId);
    }

    const savedData = await this.prisma.expenseClaim.create({
      data: {
        ...data,
        number,
        ExpenseClaimItem: { create: items },
        ExpenseClaimAttachment: { create: attachments },
      },
      include: {
        ExpenseClaimItem: true,
        ExpenseClaimAttachment: true,
      },
    });

    if (savedData.status == ClaimStatus.SUBMITTED) {
      await this.eventEmitter.emit('expenseClaim.submitted', savedData);
    }

    return savedData;
  }

  async findAll(params: {
    pageSize?: number;
    page?: number;
    companyId?: number;
    keyword?: string;
  }) {
    const { page, pageSize, keyword, companyId } = params;
    const where: Prisma.ExpenseClaimWhereInput = {};

    if (companyId) {
      where.companyId = companyId;
    }

    if (keyword) {
      where.OR = [
        { number: { contains: keyword, mode: 'insensitive' } },
        {
          Employee: {
            name: { contains: keyword, mode: 'insensitive' },
          },
        },
      ];
    }

    const data = await this.prisma.expenseClaim.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        Department: { select: { name: true } },
        Employee: { select: { name: true } },
        Company: { select: { name: true } },
      },
    });

    const total = await this.prisma.expenseClaim.count({ where });
    return { data, page, total };
  }

  findOne(id: any) {
    const where: Prisma.ExpenseClaimWhereInput = {};
    if (typeof id == 'number') where.id = id;
    if (typeof id == 'string') where.number = id;

    return this.prisma.expenseClaim.findFirstOrThrow({
      where,
      include: {
        Department: { select: { name: true } },
        Employee: { select: { name: true } },
        Company: { select: { name: true } },
        ExpenseClaimItem: {
          include: { ExpenseType: true },
        },
        ExpenseClaimAttachment: true,
        ExpenseClaimApproval: {
          orderBy: { level: 'asc' },
          include: {
            User: { select: { name: true, signatureSpeciment: true } },
          },
        },
      },
    });
  }

  async update(id: number, dto: ExpenseClaimDto) {
    const {
      ExpenseClaimItem: items,
      ExpenseClaimAttachment: attachments,
      ...data
    } = dto;

    let number = 'DRAFT';
    if (dto.status == ClaimStatus.SUBMITTED) {
      number = await this.generateNumber(dto.companyId);
    }

    const savedData = await this.prisma.expenseClaim.update({
      data: {
        ...data,
        number,
        ExpenseClaimItem: {
          deleteMany: {}, // hapus semua data item untuk di create lagi
          create: items,
        },
        ExpenseClaimAttachment: {
          deleteMany: {},
          create: attachments,
        },
      },
      where: { id },
    });

    if (savedData.status == ClaimStatus.SUBMITTED) {
      await this.eventEmitter.emit('expenseClaim.submitted', savedData);
    }

    return savedData;
  }

  async submit(id: number, employeeId: number) {
    const data = await this.findOne(id);
    const number = await this.generateNumber(data.companyId);

    const savedData = await this.prisma.expenseClaim.update({
      where: { id },
      data: {
        number,
        status: ClaimStatus.SUBMITTED,
      },
    });

    await this.eventEmitter.emit('expenseClaim.submitted', savedData);
    return savedData;
  }

  remove(id: number) {
    return this.prisma.expenseClaim.delete({ where: { id } });
  }

  async removeItem(id: number, itemId: number) {
    const data = await this.findOne(id);
    if (data.status !== ClaimStatus.DRAFT) throw new ForbiddenException();

    return this.prisma.expenseClaimItem.delete({
      where: {
        id: itemId,
        expenseClaimId: id,
      },
    });
  }

  @OnEvent('expenseClaim.submitted')
  async requestForApproval(data: ExpenseClaim) {
    const approval = await this.prisma.approvalSetting.findFirst({
      where: {
        approvalType: ApprovalType.EXPENSE_CLAIM,
        companyId: data.companyId,
      },
      include: { ApprovalSettingItem: true },
    });

    if (!approval) {
      return console.log('No approval setting');
    }

    await this.prisma.expenseClaimApproval.createMany({
      data: approval.ApprovalSettingItem.map((el) => ({
        userId: el.userId,
        approvalActionType: el.approvalActionType,
        level: el.level,
        expenseClaimId: data.id,
      })),
    });

    // Ambil user approval dengan level 1
    const firstLevelApprovals = await this.prisma.expenseClaimApproval.findMany(
      {
        where: {
          expenseClaimId: data.id,
          // level: 1, // TODO: harusnya berjenjang, sementara paralel untuk testing
        },
      },
    );

    if (firstLevelApprovals.length > 0) {
      firstLevelApprovals.forEach((approval) => {
        this.eventEmitter.emit('expenseClaim.notify', {
          data,
          approval,
        });
      });
    }
  }

  @OnEvent('expenseClaim.notify', { async: true })
  sendNotification(params: {
    data: ExpenseClaim;
    approval: ExpenseClaimApproval;
  }) {
    const { data, approval } = params;
    const approvalAction = {
      APPROVAL: 'Persetujuan',
      VERIFICATION: 'Verifikasi',
      AUTHORIZATION: 'Otorisasi',
    };

    const action = `${approvalAction[approval.approvalActionType]}`;

    this.notification.notify({
      userId: approval.userId,
      title: `Permintaan ${action}: ${data.number}`,
      message: `Anda mendapatkan permintaan ${action} untuk Klaim Pengeluaran dengan nomor ${data.number}.`,
      redirectUrl: `https://erp.rubarta.co.id/nkp-declaration?number=${data.number}`,
    });
  }

  private async generateNumber(companyId: number): Promise<string> {
    const { code } = await this.prisma.company.findUniqueOrThrow({
      where: { id: companyId },
    });

    const [month, year] = new Date()
      .toLocaleString('id-ID', {
        month: 'numeric',
        year: 'numeric',
      })
      .split('/');

    const lastData = await this.prisma.expenseClaim.findFirst({
      orderBy: { number: 'desc' },
      where: {
        number: { endsWith: year },
        companyId,
      },
    });

    let number = '001';

    if (lastData) {
      const [lastNumber] = lastData.number.split('/');
      number = (Number(lastNumber) + 1).toString().padStart(3, '0');
    }

    const romanMonth = [
      '',
      'I',
      'II',
      'III',
      'IV',
      'V',
      'VI',
      'VII',
      'VIII',
      'IX',
      'X',
      'XI',
      'XII',
    ][+month];

    return `${number}/CLAIM-${code}/${romanMonth}/${year}`;
  }

  async approve(id: number, userId: number, note?: string) {
    const approval = await this.prisma.expenseClaimApproval.findFirstOrThrow({
      where: { expenseClaimId: id, userId, approvalStatus: null },
    });

    const data = await this.prisma.expenseClaimApproval.update({
      data: { approvalStatus: ApprovalStatus.APPROVED, note: note },
      where: { id: approval.id },
    });

    const pendingApprovalCount = await this.prisma.expenseClaimApproval.count({
      where: { expenseClaimId: id, approvalStatus: null },
    });

    const status = pendingApprovalCount
      ? ClaimStatus.PARTIALLY_APPROVED
      : ClaimStatus.FULLY_APPROVED;

    await this.prisma.expenseClaim.update({
      data: { status },
      where: { id },
    });

    // TODO: Lanjut ke approval berikutnya
    return data;
  }
}
