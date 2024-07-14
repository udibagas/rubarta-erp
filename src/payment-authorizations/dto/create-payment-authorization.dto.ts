import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { PaymentAuthorizationItemDto } from './payment-authorization-item.dto';

export class CreatePaymentAuthorizationDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  companyId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  employeeId: number;

  requesterId?: number; // di set by system

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  bankId: number;

  @ApiProperty()
  @IsNotEmpty()
  bankAccount: string;

  @ApiProperty()
  @IsNumber()
  grossAmount: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  deduction: number;

  @ApiProperty()
  @IsNumber()
  netAmount: number;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  cashAdvance?: number;

  @ApiProperty()
  @IsNotEmpty()
  description: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  expenseClaimId?: number;

  @ApiProperty()
  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @ApiProperty({
    description: 'Items',
    type: Array,
    example: [
      {
        date: '2024-01-02',
        description: 'BBM Pertalite 10 Liter',
        amount: 100_000,
      },
    ],
  })
  @IsNotEmpty()
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => PaymentAuthorizationItemDto)
  @ValidateNested({ each: true })
  items: PaymentAuthorizationItemDto[];
}
