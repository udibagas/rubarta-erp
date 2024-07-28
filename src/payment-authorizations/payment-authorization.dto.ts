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
  @IsNotEmpty()
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
  @IsNotEmpty({ message: 'Company is required' })
  @IsNumber()
  companyId: number;

  @ApiProperty({ example: 1, description: 'Employee ID' })
  @IsNotEmpty({ message: 'Employee is required' })
  @IsNumber()
  employeeId: number;

  requesterId: number;

  @ApiProperty({ example: 1, description: 'Bank ID' })
  @IsNotEmpty({ message: 'Bank is required' })
  @IsNumber()
  bankId: number;

  @ApiProperty({ example: '2411191***', description: 'Bank Account' })
  @IsNotEmpty({ message: 'Bank account is required' })
  bankAccount: string;

  @ApiProperty({ example: 2_000_000, description: 'Amount before deduction' })
  @IsNumber({}, { message: 'Gross amount must be a number' })
  grossAmount: number;

  @ApiProperty({ example: 100_000, description: 'Deduction' })
  @IsOptional()
  @IsNumber({}, { message: 'Deduction must be a number' })
  deduction: number;

  @ApiProperty({ example: 1_900_000, description: 'Amount after deduction' })
  @IsNumber({}, { message: 'Net amount must be a number' })
  netAmount: number;

  @ApiProperty({ example: 2_000_000, description: 'Amount based on items' })
  @IsNumber({}, { message: 'Amount must be a number' })
  amount: number;

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