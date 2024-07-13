import { Module } from '@nestjs/common';
import { ApprovalSettingsService } from './approval-settings.service';
import { ApprovalSettingsController } from './approval-settings.controller';

@Module({
  controllers: [ApprovalSettingsController],
  providers: [ApprovalSettingsService],
})
export class ApprovalSettingsModule {}
