import { ApiProperty } from '@nestjs/swagger';
import { ApprovalType } from '@prisma/client';

export class ApprovalSetting {
  @ApiProperty()
  id: number;

  @ApiProperty()
  companyId: number;

  @ApiProperty()
  approvalType: ApprovalType;
}
