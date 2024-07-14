import { ApiProperty } from '@nestjs/swagger';
import { ApprovalSettingItem, ApprovalType } from '@prisma/client';

export class ApprovalSetting {
  @ApiProperty()
  id: number;

  @ApiProperty()
  companyId: number;

  @ApiProperty()
  approvalType: ApprovalType;

  @ApiProperty()
  ApprovalSettingItem?: ApprovalSettingItem[];
}
