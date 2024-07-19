import { User } from '@prisma/client';
export class NotificationDto {
  userId: number;

  subject: string;

  message: string;

  redirectUrl?: string;
}
