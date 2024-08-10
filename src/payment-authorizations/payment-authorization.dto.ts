import { ApiProperty } from '@nestjs/swagger';
import { Currency, PaymentStatus, PaymentType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
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
  @IsNotEmpty()
  date: Date;

  @ApiProperty({ example: 'BBM Pertalite 10 Liter' })
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 100_000 })
  @IsNumber()
  amount: number;

  @IsEnum(Currency, { message: 'Invalid currency' })
  currency: Currency;
}

export class PaymentAuthorizationDto {
  @ApiProperty({ example: 1, description: 'Company ID' })
  @IsNotEmpty({ message: 'Company is required' })
  @IsNumber()
  companyId: number;

  @IsEnum(PaymentType, { message: 'Invalid payment type' })
  paymentType: PaymentType;

  @ApiProperty({ example: 1, description: 'Employee ID' })
  @IsOptional()
  employeeId: number;

  @ApiProperty({ example: 1, description: 'Vendor ID' })
  @IsOptional()
  supplierId: number;

  requesterId: number;

  @ApiProperty({ example: 1, description: 'Bank ID' })
  @IsNotEmpty({ message: 'Bank is required' })
  @IsNumber()
  bankId: number;

  @ApiProperty({ example: '2411191***', description: 'Bank Account' })
  @IsNotEmpty({ message: 'Bank account is required' })
  bankAccount: string;

  @IsEnum(Currency, { message: 'Invalid currency' })
  currency: Currency;

  @ApiProperty({ example: 2_000_000, description: 'Amount before deduction' })
  @IsNumber({}, { message: 'Gross amount must be a number' })
  grossAmount: number;

  @ApiProperty({ example: 100_000, description: 'Tax' })
  @IsOptional()
  @IsNumber({}, { message: 'Tax must be a number' })
  tax: number;

  @ApiProperty({ example: 100_000, description: 'Deduction' })
  @IsOptional()
  @IsNumber({}, { message: 'Deduction must be a number' })
  deduction: number;

  @ApiProperty({ example: 1_900_000, description: 'Amount after deduction' })
  @IsNumber({}, { message: 'Net amount must be a number' })
  netAmount: number;

  @ApiProperty({ example: 2_000_000, description: 'DP based on items' })
  @IsNumber({}, { message: 'DP must be a number' })
  @IsOptional()
  downPayment: number;

  @ApiProperty({
    example: 2_000_000,
    description: 'Final Payment based on items',
  })
  @IsNumber({}, { message: 'Final Payment must be a number' })
  finalPayment: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber({}, { message: 'Cash advance must be a number' })
  cashAdvance?: number;

  @ApiProperty({
    example: 'Cash Advance for Bagas for 3 days',
    description: 'Description',
  })
  @IsNotEmpty({ message: 'Description is required' })
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

export class CloseNkpDto {
  @IsNotEmpty({ message: 'Bank Ref Number is required' })
  bankRefNo: string;
}
