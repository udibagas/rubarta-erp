import { Module } from '@nestjs/common';
import { ApprovalSettingsService } from './approval-settings.service';
import { ApprovalSettingsController } from './approval-settings.controller';
import { ApprovalSettingsPolicy } from './approval-settings.policy';

@Module({
  controllers: [ApprovalSettingsController],
  providers: [ApprovalSettingsService, ApprovalSettingsPolicy],
})
export class ApprovalSettingsModule {}
