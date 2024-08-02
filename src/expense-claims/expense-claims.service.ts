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
      this.eventEmitter.emit('expenseClaim.submitted', savedData);
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
      // TODO: tambahin searching
    }

    const data = await this.prisma.expenseClaim.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      where,
      include: {
        Department: { select: { name: true } },
        User: { select: { name: true } },
        Company: { select: { name: true } },
      },
    });

    const total = await this.prisma.expenseClaim.count({ where });
    return { data, page, total };
  }

  findOne(id: number) {
    return this.prisma.expenseClaim.findUniqueOrThrow({
      where: { id },
      include: {
        Department: { select: { name: true } },
        User: { select: { name: true } },
        Company: { select: { name: true } },
        ExpenseClaimItem: {
          include: { ExpenseType: true },
        },
        ExpenseClaimAttachment: true,
        ExpenseClaimApproval: {
          include: {
            User: { select: { name: true } },
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
      this.eventEmitter.emit('expenseClaim.submitted', savedData);
    }

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
      message: `Anda mendapatkan permintaan ${action} untuk <b>Klaim Pengeluaran</b> dengan nomor <b>${data.number}</b>.`,
      redirectUrl: `https://erp.rubarta.co.id/expense-claims?number=${data.number}`,
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
    const approvals = await this.prisma.expenseClaimApproval.findMany({
      where: { expenseClaimId: id },
    });

    if (approvals.length == 0)
      throw new ForbiddenException('No approval set for this expense claim');

    const approval = await this.prisma.expenseClaimApproval.findFirst({
      where: { expenseClaimId: id, userId },
    });

    if (!approval)
      throw new ForbiddenException('You can not approve this expense claim');

    if (approval.approvalStatus == ApprovalStatus.APPROVED)
      throw new ForbiddenException(
        'You have approved this payment authorization',
      );

    if (approval.approvalStatus == ApprovalStatus.REJECTED)
      throw new ForbiddenException(
        'You have rejected this payment authorization',
      );

    await this.prisma.expenseClaimApproval.update({
      data: { approvalStatus: ApprovalStatus.APPROVED, note: note },
      where: {
        id: approval.id,
      },
    });

    const pendingApprovalCount = await this.prisma.expenseClaimApproval.count({
      where: { expenseClaimId: id, approvalStatus: null },
    });

    const status = pendingApprovalCount
      ? ClaimStatus.PARTIIALLY_APPROVED
      : ClaimStatus.FULLY_APPROVED;

    const data = await this.prisma.expenseClaim.update({
      data: { status },
      where: { id },
      include: {
        ExpenseClaimItem: true,
        ExpenseClaimAttachment: true,
        ExpenseClaimApproval: {
          include: {
            User: { select: { name: true, signatureSpeciment: true } },
          },
          orderBy: { level: 'asc' },
        },
        User: { select: { name: true } },
        Company: { select: { name: true } },
      },
    });

    // TODO: Lanjut ke approval berikutnya
    // this.eventEmitter.emit('paymentAuthorization.approved', data);
    // this.eventEmitter.emit(
    //   'paymentAuthorization.updated',
    //   data,
    //   data.Requester,
    //   PaymentStatus.FULLY_APPROVED,
    //   note,
    // );
    return data;
  }

  reject(id: number) {
    return this.prisma.expenseClaim.update({
      data: {
        status: ClaimStatus.REJECTED,
      },
      where: { id },
    });
  }
}
