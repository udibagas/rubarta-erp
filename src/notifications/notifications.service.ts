import { NotificationDto } from './notification.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(
    // private readonly mailerService: MailerService,
    private readonly prisma: PrismaService,
  ) {}

  findAll(userId: number) {
    return this.prisma.notification.findMany({
      where: { userId },
    });
  }

  findOne(id: number) {
    return this.prisma.notification.findUniqueOrThrow({ where: { id } });
  }

  remove(id: number) {
    return this.prisma.notification.delete({ where: { id } });
  }

  removeAll(userId: number) {
    return this.prisma.notification.deleteMany({ where: { userId } });
  }

  read(id: number) {
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

  // async send(notificationDto: NotificationDto) {
  //   const { userId, subject, message, redirectUrl } = notificationDto;

  //   const user = await this.prisma.user.findUniqueOrThrow({
  //     where: { id: userId },
  //   });

  //   return this.mailerService.sendMail({
  //     to: user.email,
  //     subject,
  //     template: 'notification',
  //     context: {
  //       subject,
  //       message,
  //       redirectUrl,
  //       user,
  //     },
  //   });
  // }

  create(notificationDto: NotificationDto) {
    return this.prisma.notification.create({
      data: notificationDto,
    });
  }

  notify(notificationDto: NotificationDto) {
    this.create(notificationDto);
    // this.send(notificationDto);
  }
}
