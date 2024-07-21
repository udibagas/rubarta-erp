import { User } from '@prisma/client';
export class NotificationDto {
  userId: number;

  title: string;

  message: string;

  redirectUrl?: string;
}
