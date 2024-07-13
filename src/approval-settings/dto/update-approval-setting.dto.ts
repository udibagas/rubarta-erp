import { PartialType } from '@nestjs/swagger';
import { CreateApprovalSettingDto } from './create-approval-setting.dto';

export class UpdateApprovalSettingDto extends PartialType(CreateApprovalSettingDto) {}
