export class NotificationDto {
  userId: number;

  title: string;

  message: string;

  redirectUrl?: string;
}

export interface DraftDocument {
  id: number;
  number: string;
  User: { id: number; name: string };
}
