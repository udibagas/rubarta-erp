import { ApiProperty } from '@nestjs/swagger';
import { ApprovalActionType, ApprovalType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  ValidateNested,
} from 'class-validator';

export class ApprovalSettingItemDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  level: number;

  @ApiProperty({
    example: [
      {
        userId: 1,
        level: 1,
        approvalActionType: 'APPROVAL | VERIFICATION | PAYMENT',
      },
    ],
  })
  @IsNotEmpty()
  @IsEnum(ApprovalActionType)
  approvalActionType: ApprovalActionType;
}

export class ApprovalSettingDto {
  @ApiProperty({
    description: 'Company ID',
    example: 1,
  })
  @IsNotEmpty()
  companyId: number;

  @ApiProperty({
    description: 'Approval type',
    example: ApprovalType.PAYMENT_AUTHORIZATION,
  })
  @IsNotEmpty()
  @IsEnum(ApprovalType)
  approvalType: ApprovalType;

  @ApiProperty({
    description: 'Approval setting item',
    type: Array,
    example: [
      {
        userId: 1,
        level: 1,
        approvalActionType: 'APPROVAL | VERIFICATION | PAYMENT',
      },
    ],
  })
  @IsNotEmpty()
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => ApprovalSettingItemDto)
  @ValidateNested({ each: true })
  items: ApprovalSettingItemDto[];
}
