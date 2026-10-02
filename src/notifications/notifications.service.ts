import { NotificationDto } from './notification.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../prisma/client/client';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(params: {
    userId?: number;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { userId, keyword, page, pageSize } = params;
    const where: Prisma.NotificationWhereInput = {};

    if (userId) {
      where.userId = userId;
    }

    if (keyword) {
      where.OR = [
        { title: { contains: keyword, mode: 'insensitive' } },
        { message: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const data = await this.prisma.notification.findMany({
      orderBy: { date: 'desc' },
      where,
      take: pageSize,
      skip: (page - 1) * pageSize,
      include: { User: { select: { name: true } } },
    });

    const total = await this.prisma.notification.count({ where });
    return { data, page, total };
  }

  findOne(id: number) {
    return this.prisma.notification.findUniqueOrThrow({ where: { id } });
  }

  getUnreadCount(userId: number) {
    return this.prisma.notification.count({
      where: { readAt: null, userId },
    });
  }

  remove(id: number) {
    return this.prisma.notification.delete({ where: { id } });
  }

  removeAll(userId: number) {
    return this.prisma.notification.deleteMany({ where: { userId } });
  }

  async read(id: number) {
    const notification = await this.findOne(id);
    if (notification.readAt) return notification;
    return this.prisma.notification.update({
      data: { readAt: new Date() },
      where: { id },
    });
  }

  readAll(userId: number) {
    return this.prisma.notification.updateMany({
      data: { readAt: new Date() },
      where: { userId },
    });
  }

  async send(notificationDto: NotificationDto) {
    const { userId, title: subject, message, redirectUrl } = notificationDto;

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    return this.mailerService.sendMail({
      to: user.email,
      subject,
      template: 'notification',
      context: {
        subject,
        message,
        redirectUrl,
        user,
      },
    });
  }

  create(notificationDto: NotificationDto) {
    return this.prisma.notification.create({
      data: notificationDto,
    });
  }

  async notify(notificationDto: NotificationDto) {
    await this.create(notificationDto);
    this.send(notificationDto);
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async notifyDraftDocuments() {
    interface DraftDocument {
      id: number;
      number: string;
      User: { id: number; name: string };
    }

    const draftQuotations: DraftDocument[] =
      await this.prisma.quotation.findMany({
        where: { status: 'Draft' },
        select: {
          id: true,
          number: true,
          User: { select: { id: true, name: true } },
        },
      });

    const draftPurchaseOrders: DraftDocument[] =
      await this.prisma.purchaseOrder.findMany({
        where: { status: 'Draft' },
        select: {
          id: true,
          number: true,
          User: { select: { id: true, name: true } },
        },
      });

    const draftSalesOrders: DraftDocument[] =
      await this.prisma.salesOrder.findMany({
        where: { status: 'Draft' },
        select: {
          id: true,
          number: true,
          User: { select: { id: true, name: true } },
        },
      });

    const draftInvoices: DraftDocument[] = await this.prisma.invoice.findMany({
      where: { status: 'Draft' },
      select: {
        id: true,
        number: true,
        User: { select: { id: true, name: true } },
      },
    });

    const draftGoodsReceipts: DraftDocument[] =
      await this.prisma.goodsReceipt.findMany({
        where: { status: 'Draft' },
        select: {
          id: true,
          number: true,
          User: { select: { id: true, name: true } },
        },
      });

    const draftDeliveryOrders: DraftDocument[] =
      await this.prisma.deliveryOrder.findMany({
        where: { status: 'Draft' },
        select: {
          id: true,
          number: true,
          User: { select: { id: true, name: true } },
        },
      });

    const allDraftDocuments = [
      ...draftQuotations,
      ...draftPurchaseOrders,
      ...draftSalesOrders,
      ...draftInvoices,
      ...draftGoodsReceipts,
      ...draftDeliveryOrders,
    ];

    for (const doc of allDraftDocuments) {
      console.log(
        `Notifying user ${doc.User.name} about draft document #${doc.number}`,
      );

      this.notify({
        title: `[Pengingat] Dokumen belum diselesaikan: #${doc.number}`,
        message: `Dokumen dengan nomor #${doc.number} belum diselesaikan. Silakan tinjau dan selesaikan segera.`,
        redirectUrl: `https://erp.rubarta.co.id`,
        userId: doc.User.id,
      });
    }
  }
}
