import { Module } from '@nestjs/common';
import { TestService } from './test.service';
import { NotificationsModule } from '../src/notifications/notifications.module';

@Module({
  providers: [TestService],
  imports: [NotificationsModule],
})
export class TestModule {}
