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

export class PaymentAuthorizationItemDto {
  @ApiProperty({
    example: new Date(),
  })
  @IsDate()
  date: Date;

  @ApiProperty({ example: 'BBM Pertalite 10 Liter' })
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 100_000 })
  @IsNumber()
  amount: number;
}

export class PaymentAuthorizationDto {
  @ApiProperty({ example: 1, description: 'Company ID' })
  @IsNotEmpty()
  @IsNumber()
  companyId: number;

  @ApiProperty({ example: 1, description: 'Employee ID' })
  @IsNotEmpty()
  @IsNumber()
  employeeId: number;

  requesterId: number;

  @ApiProperty({ example: 1, description: 'Bank ID' })
  @IsNotEmpty()
  @IsNumber()
  bankId: number;

  @ApiProperty({ example: '2411191***', description: 'Bank Account' })
  @IsNotEmpty()
  bankAccount: string;

  @ApiProperty({ example: 2_000_000, description: 'Amount before deduction' })
  @IsNumber()
  grossAmount: number;

  @ApiProperty({ example: 100_000, description: 'Deduction' })
  @IsOptional()
  @IsNumber()
  deduction: number;

  @ApiProperty({ example: 1_900_000, description: 'Amount after deduction' })
  @IsNumber()
  netAmount: number;

  @ApiProperty({ example: 2_000_000, description: 'Amount based on items' })
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  cashAdvance?: number;

  @ApiProperty({
    example: 'Cash Advance for Bagas for 3 days',
    description: 'Description',
  })
  @IsNotEmpty()
  description: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  expenseClaimId?: number;

  @ApiProperty({ example: 'SUBMITTED', description: 'Status' })
  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @ApiProperty({
    description: 'Items',
    type: PaymentAuthorizationItemDto,
    isArray: true,
  })
  @IsNotEmpty()
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => PaymentAuthorizationItemDto)
  @ValidateNested({ each: true })
  PaymentAuthorizationItem: PaymentAuthorizationItemDto[];
}
