import { Global, Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsPolicy } from './notifications.policy';

@Global()
@Module({
  providers: [NotificationsService, NotificationsPolicy],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
