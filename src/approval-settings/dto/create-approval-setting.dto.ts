import { ApiProperty } from '@nestjs/swagger';
import { ApprovalType } from '@prisma/client';
import { IsIn, IsNotEmpty } from 'class-validator';

export class CreateApprovalSettingDto {
  @ApiProperty()
  @IsNotEmpty()
  companyId: number;

  @ApiProperty()
  @IsNotEmpty()
  // @IsIn([ApprovalType.EXPENSE_CLAIM, ApprovalType.PAYMENT_AUTHORIZATION])
  approvalType: ApprovalType;
}
