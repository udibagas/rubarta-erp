import { ForbiddenException, Injectable } from '@nestjs/common';
import { PaymentAuthorizationDto } from './payment-authorization.dto';
import { PrismaService } from '../prisma/prisma.service';
import {
  ApprovalStatus,
  ApprovalType,
  PaymentAuthorization,
  PaymentAuthorizationApproval,
  PaymentStatus,
  Prisma,
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

  async create(paymentAuthorizationDto: PaymentAuthorizationDto) {
    const { PaymentAuthorizationItem: items, ...data } =
      paymentAuthorizationDto;
    let number = 'DRAFT';

    if (data.status == PaymentStatus.SUBMITTED) {
      number = await this.generateNumber(data.companyId);
    }

    const savedData = await this.prisma.paymentAuthorization.create({
      include: { PaymentAuthorizationItem: true, Requester: true },
      data: {
        ...data,
        number,
        PaymentAuthorizationItem: { create: items },
      },
    });

    if (savedData.status == PaymentStatus.SUBMITTED) {
      this.eventEmitter.emit('paymentAuthorization.submitted', savedData);
      this.eventEmitter.emit('paymentAuthorization.updated', {
        data: savedData,
        user: savedData.Requester,
        status: PaymentStatus.SUBMITTED,
        note: 'Request is submitted',
      });
    }

    return savedData;
  }

  async findAll(params: {
    page: number;
    pageSize: number;
    companyId?: number;
    keyword?: string;
  }) {
    const { page, pageSize, companyId, keyword } = params;
    const where: Prisma.PaymentAuthorizationWhereInput = {};

    if (companyId) {
      where.companyId = companyId;
    }

    if (keyword) {
      where.OR = [
        { number: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
        {
          Employee: {
            name: { contains: keyword, mode: 'insensitive' },
          },
        },
      ];
    }

    const data = await this.prisma.paymentAuthorization.findMany({
      take: pageSize,
      skip: (page - 1) * pageSize,
      where,
      include: {
        PaymentAuthorizationItem: true,
        Employee: true,
        Requester: true,
        Bank: true,
        Company: true,
      },
    });

    const total = await this.prisma.paymentAuthorization.count({ where });
    return { data, page, total };
  }

  findOne(id: number) {
    return this.prisma.paymentAuthorization.findUniqueOrThrow({
      where: { id },
      include: {
        PaymentAuthorizationItem: true,
        PaymentAuthorizationApproval: {
          include: { User: true },
        },
        Requester: true,
        Employee: true,
        ExpenseClaim: true,
        Company: true,
      },
    });
  }

  async update(id: number, paymentAuthorizationDto: PaymentAuthorizationDto) {
    const existingData = await this.findOne(id);
    if (existingData.status !== PaymentStatus.DRAFT)
      throw new ForbiddenException();

    const { PaymentAuthorizationItem: items, ...data } =
      paymentAuthorizationDto;
    const savedData = await this.prisma.paymentAuthorization.update({
      where: { id },
      data: {
        ...data,
        PaymentAuthorizationItem: { deleteMany: {}, create: items },
      },
      include: {
        PaymentAuthorizationItem: true,
        Requester: true,
      },
    });

    if (savedData.status == PaymentStatus.SUBMITTED) {
      this.eventEmitter.emit('paymentAuthorization.submitted', savedData);
      this.eventEmitter.emit('paymentAuthorization.updated', {
        data: savedData,
        user: savedData.Requester,
        status: PaymentStatus.SUBMITTED,
        note: 'Request is submitted',
      });
    }

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

  async approve(id: number, user: User, note?: string) {
    const approvals = await this.prisma.paymentAuthorizationApproval.findMany({
      where: { paymentAuthorizationId: id },
    });

    if (approvals.length == 0)
      throw new ForbiddenException(
        'No approval set for this payment authorization',
      );

    const approval = await this.prisma.paymentAuthorizationApproval.findFirst({
      where: { paymentAuthorizationId: id, userId: user.id },
    });

    if (!approval)
      throw new ForbiddenException(
        'You can not approve this payment authorization',
      );

    if (approval.approvalStatus == ApprovalStatus.APPROVED)
      throw new ForbiddenException(
        'You have approved this payment authorization',
      );

    if (approval.approvalStatus == ApprovalStatus.REJECTED)
      throw new ForbiddenException(
        'You have rejected this payment authorization',
      );

    await this.prisma.paymentAuthorizationApproval.update({
      data: { approvalStatus: ApprovalStatus.APPROVED, note: note },
      where: {
        id: approval.id,
      },
    });

    const approvedCount = await this.prisma.paymentAuthorizationApproval.count({
      where: { approvalStatus: ApprovalStatus.APPROVED },
    });

    const status =
      approvals.length == approvedCount
        ? PaymentStatus.FULLY_APPROVED
        : PaymentStatus.PARTIIALLY_APPROVED;

    const data = await this.prisma.paymentAuthorization.update({
      include: { Requester: true },
      data: { status },
      where: { id },
    });

    this.eventEmitter.emit('paymentAuthorization.approved', data);
    this.eventEmitter.emit(
      'paymentAuthorization.updated',
      data,
      data.Requester,
      PaymentStatus.FULLY_APPROVED,
      note,
    );
    return data;
  }

  async verify(id: number, user: User) {
    const data = await this.prisma.paymentAuthorization.update({
      data: { status: PaymentStatus.VERIFIED },
      where: { id },
    });

    this.eventEmitter.emit('paymentAuthorization.verified', data);
    return data;
  }

  async reject(id: number, user: User, note?: string) {
    const data = await this.prisma.paymentAuthorization.update({
      data: { status: PaymentStatus.REJECTED },
      where: { id },
    });

    this.eventEmitter.emit('paymentAuthorization.rejected', data);
    return data;
  }

  async pay(id: number, user: User) {
    const data = await this.prisma.paymentAuthorization.update({
      data: { status: PaymentStatus.PAID },
      where: { id },
    });

    this.eventEmitter.emit('paymentAuthorization.paid', data);
    return data;
  }

  private async generateNumber(companyId) {
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

  @OnEvent('paymentAuthorization.submitted')
  async requestForApproval(data: PaymentAuthorization) {
    // get approval setting
    const approval = await this.prisma.approvalSetting.findFirst({
      where: {
        approvalType: ApprovalType.PAYMENT_AUTHORIZATION,
        companyId: data.companyId,
      },
      include: { ApprovalSettingItem: true },
    });

    if (approval) {
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
            level: 1,
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
  }

  @OnEvent('paymentAuthorization.updated', { async: true })
  updateLog(params: {
    data: PaymentAuthorization;
    user: User;
    status: PaymentStatus;
    note?: string;
  }) {
    const { data, user, status, note } = params;
    return this.prisma.paymentAuthorizationLog.create({
      data: {
        paymentAuthorizationId: data.id,
        status: status,
        userId: user.id,
        note: note,
      },
    });
  }

  @OnEvent('paymentAuthorization.notify', { async: true })
  sendNotification(params: {
    data: PaymentAuthorization;
    approval: PaymentAuthorizationApproval;
  }) {
    const { data, approval } = params;
    this.notification.notify({
      userId: approval.userId,
      title: `Permintaan Persetujuan: ${data.number}`,
      message: `Anda mendapatkan permintaan persetujuan untuk Nota Kuasa Pembayaran dengan nomor ${data.number}.`,
      redirectUrl: 'https://erp.rubarta.co.id/payment-authorizations',
    });
  }
}
