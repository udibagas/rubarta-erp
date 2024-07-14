import { ForbiddenException, Injectable } from '@nestjs/common';
import { CreatePaymentAuthorizationDto } from './dto/create-payment-authorization.dto';
import { UpdatePaymentAuthorizationDto } from './dto/update-payment-authorization.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  ApprovalStatus,
  ApprovalType,
  PaymentAuthorization,
  PaymentStatus,
  User,
} from '@prisma/client';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class PaymentAuthorizationsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(createPaymentAuthorizationDto: CreatePaymentAuthorizationDto) {
    const { items, ...data } = createPaymentAuthorizationDto;
    let number = 'DRAFT';

    if (data.status == PaymentStatus.SUBMITTED) {
      number = await this.generateNumber(data.companyId);
    }

    const savedData = await this.prisma.paymentAuthorization.create({
      include: { PaymentAuthorizationItem: true },
      data: {
        ...data,
        number,
        PaymentAuthorizationItem: { create: items },
      },
    });

    if (savedData.status == PaymentStatus.SUBMITTED) {
      this.eventEmitter.emit('paymentAuthorization.submitted', savedData);
    }

    return savedData;
  }

  findAll() {
    // TODO: implement pagination & filter
    return this.prisma.paymentAuthorization.findMany();
  }

  findOne(id: number) {
    return this.prisma.paymentAuthorization.findUniqueOrThrow({
      where: { id },
    });
  }

  async update(
    id: number,
    updatePaymentAuthorizationDto: UpdatePaymentAuthorizationDto,
  ) {
    const data = await this.findOne(id);
    if (data.status !== PaymentStatus.DRAFT) throw new ForbiddenException();
    return this.prisma.paymentAuthorization.update({
      where: { id },
      data: updatePaymentAuthorizationDto,
    });
  }

  async remove(id: number) {
    const data = await this.findOne(id);
    if (data.status !== PaymentStatus.DRAFT) throw new ForbiddenException();
    return this.prisma.paymentAuthorization.delete({
      where: { id },
    });
  }

  async approve(id: number) {
    const data = await this.prisma.paymentAuthorization.update({
      data: { status: PaymentStatus.APPROVED },
      where: { id },
    });

    this.eventEmitter.emit('paymentAuthorization.approved', data);
    return data;
  }

  async verify(id: number) {
    const data = await this.prisma.paymentAuthorization.update({
      data: { status: PaymentStatus.VERIFIED },
      where: { id },
    });

    this.eventEmitter.emit('paymentAuthorization.verified', data);
    return data;
  }

  async reject(id: number) {
    const data = await this.prisma.paymentAuthorization.update({
      data: { status: PaymentStatus.REJECTED },
      where: { id },
    });

    this.eventEmitter.emit('paymentAuthorization.rejected', data);
    return data;
  }

  async pay(id: number) {
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
      include: {
        ApprovalSettingItem: true,
      },
    });

    // set approval
    if (approval) {
      const approvals =
        await this.prisma.paymentAuthorizationApproval.createMany({
          data: approval.ApprovalSettingItem.map(({ userId }) => {
            return {
              userId,
              paymentAuthorizationId: data.id,
            };
          }),
        });
    }
  }

  @OnEvent('paymentAuthorization.notifiy')
  async sendNotification(user: User, data: PaymentAuthorization) {
    // TODO: create notification and send email
  }
}
