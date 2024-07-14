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

export class CreateApprovalSettingItemDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  level: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(ApprovalActionType)
  approvalActionType: ApprovalActionType;
}

export class CreateApprovalSettingDto {
  @ApiProperty()
  @IsNotEmpty()
  companyId: number;

  @ApiProperty()
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
  @Type(() => CreateApprovalSettingItemDto)
  @ValidateNested({ each: true })
  items: CreateApprovalSettingItemDto[];
}
