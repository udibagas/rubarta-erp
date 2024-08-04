import { NotificationDto } from './notification.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

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
}
