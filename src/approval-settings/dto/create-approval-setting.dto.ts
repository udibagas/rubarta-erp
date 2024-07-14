import { ApiProperty } from '@nestjs/swagger';
import { ApprovalType } from '@prisma/client';
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
}

export class CreateApprovalSettingDto {
  @ApiProperty()
  @IsNotEmpty()
  companyId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(ApprovalType)
  approvalType: ApprovalType;

  @ApiProperty()
  @IsNotEmpty()
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => CreateApprovalSettingItemDto)
  @ValidateNested({ each: true })
  approvalSettingItem: CreateApprovalSettingItemDto[];
}
