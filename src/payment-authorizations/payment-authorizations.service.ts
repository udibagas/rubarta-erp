import { ForbiddenException, Injectable } from '@nestjs/common';
import {
  CloseNkpDto,
  PaymentAuthorizationDto,
} from './payment-authorization.dto';
import { PrismaService } from '../prisma/prisma.service';
import {
  ApprovalStatus,
  ApprovalType,
  PaymentAuthorization,
  PaymentAuthorizationApproval,
  PaymentStatus,
  PaymentType,
  Prisma,
  Role,
  User,
} from '@prisma/client';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class PaymentAuthorizationsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private notification: NotificationsService,
  ) {}

  async create(dto: PaymentAuthorizationDto) {
    const {
      PaymentAuthorizationItem: items,
      PaymentAuthorizationAttachment: attachments,
      ...data
    } = dto;
    let number = 'DRAFT';

    if (data.status == PaymentStatus.SUBMITTED) {
      number = await this.generateNumber(data.companyId);
    }

    const savedData = await this.prisma.paymentAuthorization.create({
      include: { Requester: true },
      data: {
        ...data,
        number,
        PaymentAuthorizationItem: { create: items },
        PaymentAuthorizationAttachment: { create: attachments },
      },
    });

    if (savedData.status == PaymentStatus.SUBMITTED) {
      this.eventEmitter.emit('paymentAuthorization.submitted', savedData);
    }

    return savedData;
  }

  async findAll(params: {
    page: number;
    pageSize: number;
    companyId?: number;
    paymentType?: PaymentType;
    keyword?: string;
    dateRange?: any;
    action?: string;
    format?: string;
  }) {
    const {
      page,
      pageSize,
      companyId,
      keyword,
      paymentType,
      dateRange,
      action,
      format,
    } = params;

    const where: Prisma.PaymentAuthorizationWhereInput = {};

    if (companyId) {
      where.companyId = companyId;
    }

    if (
      paymentType &&
      [PaymentType.EMPLOYEE, PaymentType.VENDOR].includes(paymentType)
    ) {
      where.paymentType = paymentType;
    }

    if (dateRange && dateRange !== 'null') {
      const [start, end] =
        typeof dateRange == 'object' ? dateRange : dateRange.split(',');
      where.date = { gte: new Date(start), lte: new Date(end) };
    }

    // kalau ga ada page asumsi dari report
    if (action) {
      where.status = { not: 'DRAFT' };
    }

    if (keyword) {
      where.OR = [
        { number: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
        { bankRefNo: { contains: keyword, mode: 'insensitive' } },
        {
          Employee: {
            name: { contains: keyword, mode: 'insensitive' },
          },
        },
      ];
    }

    const options: Prisma.PaymentAuthorizationFindManyArgs = {
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        Employee: { select: { name: true } },
        Supplier: { select: { name: true } },
        Requester: { select: { name: true } },
        Bank: { select: { code: true, name: true } },
        Company: { select: { name: true } },
        Child: { select: { id: true, number: true, finalPayment: true } },
        Parent: { select: { id: true, number: true, finalPayment: true } },
        PaymentAuthorizationAttachment: {
          select: {
            fileName: true,
            fileType: true,
            filePath: true,
            fileSize: true,
          },
        },
      },
    };

    if (!action) {
      options.take = pageSize;
      options.skip = (page - 1) * pageSize;
    }

    const data = await this.prisma.paymentAuthorization.findMany(options);

    if (action == 'download') {
      if (format == 'pdf') {
        const company = await this.prisma.company.findUniqueOrThrow({
          where: { id: companyId },
        });

        return { data, company };
      }

      if (format == 'excel') return data;
    }

    const total = await this.prisma.paymentAuthorization.count({ where });
    return { data, page, total };
  }

  findOne(id: any) {
    const where: Prisma.PaymentAuthorizationWhereInput = {};
    if (typeof id == 'number') where.id = id;
    if (typeof id == 'string') where.number = id;

    return this.prisma.paymentAuthorization.findFirstOrThrow({
      where,
      include: {
        PaymentAuthorizationItem: true,
        PaymentAuthorizationApproval: {
          orderBy: { level: 'asc' },
          include: {
            User: {
              select: { name: true, signatureSpeciment: true },
            },
          },
        },
        Requester: { select: { name: true } },
        Employee: { select: { name: true } },
        Supplier: { select: { name: true } },
        Company: { select: { name: true } },
        Bank: { select: { code: true, name: true } },
        Child: { select: { id: true, number: true, finalPayment: true } },
        Parent: { select: { id: true, number: true, finalPayment: true } },
        PaymentAuthorizationAttachment: {
          select: {
            fileName: true,
            fileType: true,
            filePath: true,
            fileSize: true,
          },
        },
      },
    });
  }

  async update(id: number, dto: PaymentAuthorizationDto) {
    const existingData = await this.findOne(id);
    if (existingData.status !== PaymentStatus.DRAFT)
      throw new ForbiddenException();

    let number = 'DRAFT';
    if (dto.status == PaymentStatus.SUBMITTED) {
      number = await this.generateNumber(dto.companyId);
    }

    const {
      PaymentAuthorizationItem: items,
      PaymentAuthorizationAttachment: attachments,
      ...data
    } = dto;
    const savedData = await this.prisma.paymentAuthorization.update({
      where: { id },
      data: {
        ...data,
        number,
        PaymentAuthorizationItem: { deleteMany: {}, create: items },
        PaymentAuthorizationAttachment: { deleteMany: {}, create: attachments },
      },
      include: {
        PaymentAuthorizationItem: true,
        Requester: true,
      },
    });

    if (savedData.status == PaymentStatus.SUBMITTED) {
      this.eventEmitter.emit('paymentAuthorization.submitted', savedData);
    }

    return savedData;
  }

  async submit(id: number, requesterId: number) {
    const data = await this.findOne(id);
    const number = await this.generateNumber(data.companyId);

    const savedData = await this.prisma.paymentAuthorization.update({
      where: { id, requesterId },
      data: {
        number,
        status: PaymentStatus.SUBMITTED,
      },
    });

    this.eventEmitter.emit('paymentAuthorization.submitted', savedData);
    return savedData;
  }

  async remove(id: number) {
    const data = await this.findOne(id);
    if (data.status !== PaymentStatus.DRAFT) throw new ForbiddenException();
    return this.prisma.paymentAuthorization.delete({
      where: { id },
    });
  }

  async removeItem(id: number, itemId: number) {
    const data = await this.findOne(id);
    if (data.status !== PaymentStatus.DRAFT) throw new ForbiddenException();
    return this.prisma.paymentAuthorizationItem.delete({
      where: { id: itemId },
    });
  }

  async approve(id: number, userId: number, note?: string) {
    const approval =
      await this.prisma.paymentAuthorizationApproval.findFirstOrThrow({
        where: { paymentAuthorizationId: id, userId, approvalStatus: null },
        include: { PaymentAuthorization: true },
      });

    const data = await this.prisma.paymentAuthorizationApproval.update({
      data: { approvalStatus: ApprovalStatus.APPROVED, note: note },
      where: { id: approval.id },
    });

    const pendingApprovalCount =
      await this.prisma.paymentAuthorizationApproval.count({
        where: { paymentAuthorizationId: id, approvalStatus: null },
      });

    const status = pendingApprovalCount
      ? PaymentStatus.PARTIALLY_APPROVED
      : PaymentStatus.FULLY_APPROVED;

    await this.prisma.paymentAuthorization.update({
      data: { status },
      where: { id },
    });

    // TODO: Lanjut ke approval berikutnya

    if (!pendingApprovalCount) {
      const request = approval.PaymentAuthorization;

      // sementara kirim ke ke semua admin
      const admins = await this.prisma.user.findMany({
        where: {
          roles: {
            hasSome: [Role.ADMIN],
          },
        },
      });

      admins.forEach((user) => {
        this.notification.notify({
          userId: user.id,
          title: `NKP Nomor ${request.number} telah disetujui sepenuhnya`,
          message: `NKP Nomor ${request.number} telah disetujui sepenuhnya. Silakan lanjutkan ke proses berikutnya`,
          redirectUrl: `https://erp.rubarta.co.id/nkp?number=${request.number}`,
        });
      });
    }

    return data;
  }

  close(id: number, data: CloseNkpDto, user: User) {
    if (!user.roles.includes('ADMIN')) {
      throw new ForbiddenException('Anda tidak boleh melakukan aksi ini');
    }

    const { bankRefNo, attachments } = data;

    return this.prisma.paymentAuthorization.update({
      data: {
        status: PaymentStatus.CLOSED,
        bankRefNo,
        PaymentAuthorizationAttachment: attachments.length
          ? { createMany: { data: attachments } }
          : {},
      },
      where: { id },
    });
  }

  private async generateNumber(companyId: number): Promise<string> {
    const { code } = await this.prisma.company.findUniqueOrThrow({
      where: { id: companyId },
    });

    const bank = 'DNM'; // TODO: apakah harusnya dinamis? DNM = Bank Danamon

    const [month, year] = new Date()
      .toLocaleString('id-ID', {
        month: 'numeric',
        year: 'numeric',
      })
      .split('/');

    const lastData = await this.prisma.paymentAuthorization.findFirst({
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

    return `${number}/NKP-${bank}-${code}/${romanMonth}/${year}`;
  }

  @OnEvent('paymentAuthorization.submitted', { async: true })
  async requestForApproval(data: PaymentAuthorization) {
    const approval = await this.prisma.approvalSetting.findFirst({
      where: {
        approvalType: ApprovalType.NKP,
        companyId: data.companyId,
      },
      include: { ApprovalSettingItem: true },
    });

    await this.prisma.paymentAuthorizationApproval.createMany({
      data: approval.ApprovalSettingItem.map((el) => ({
        userId: el.userId,
        approvalActionType: el.approvalActionType,
        level: el.level,
        paymentAuthorizationId: data.id,
      })),
    });

    // Ambil user approval dengan level 1
    const firstLevelApprovals =
      await this.prisma.paymentAuthorizationApproval.findMany({
        where: {
          paymentAuthorizationId: data.id,
          // level: 1, // TODO: harusnya berjenjang, sementara paralel untuk testing
        },
      });

    if (firstLevelApprovals.length > 0) {
      firstLevelApprovals.forEach((approval) => {
        this.eventEmitter.emit('paymentAuthorization.notify', {
          data,
          approval,
        });
      });
    }
  }

  @OnEvent('paymentAuthorization.notify', { async: true })
  sendNotification(params: {
    data: PaymentAuthorization;
    approval: PaymentAuthorizationApproval;
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
      message: `Anda mendapatkan permintaan ${action} untuk Nota Kuasa Pembayaran dengan nomor ${data.number}.`,
      redirectUrl: `https://erp.rubarta.co.id/nkp?number=${data.number}`,
    });
  }
}
