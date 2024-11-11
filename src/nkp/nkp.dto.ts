import { ApiProperty } from '@nestjs/swagger';
import { Currency, NkpType, PaymentStatus, PaymentType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class NkpItemDto {
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

export class NkpAttachmentDto {
  @IsNotEmpty()
  fileName: string;

  @IsNotEmpty()
  filePath: string;

  @IsNotEmpty()
  fileType: string;

  @IsNumber()
  fileSize: number;
}

export class NkpDto {
  @ApiProperty({ example: 1, description: 'Company ID' })
  @IsNotEmpty({ message: 'Company is required' })
  @IsNumber()
  companyId: number;

  @IsEnum(PaymentType, { message: 'Please select payment target' })
  paymentType: PaymentType;

  @IsEnum(NkpType, { message: 'Please select payment type' })
  nkpType: NkpType;

  @IsOptional()
  invoiceNumber?: string;

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
  @MaxLength(30, { message: 'Max bank account is 30 characters' })
  bankAccount: string;

  @IsEnum(Currency, { message: 'Invalid currency' })
  currency: Currency;

  @ApiProperty({ example: 2_000_000, description: 'Amount before deduction' })
  @IsNumber({}, { message: 'Gross amount must be a number' })
  grandTotal: number;

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

  @ApiProperty({ example: 2_000_000, description: 'Total Amount' })
  @IsNumber({}, { message: 'Total amount must be a number' })
  @IsOptional()
  totalAmount: number;

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
  cashAdvanceBalance: number;

  @ApiProperty({
    example: 'Cash Advance for Bagas for 3 days',
    description: 'Description',
  })
  @IsNotEmpty({ message: 'Description is required' })
  description: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  parentId?: number;

  @ApiProperty()
  @IsOptional()
  sourceBank?: string;

  @ApiProperty({ example: 'SUBMITTED', description: 'Status' })
  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @ApiProperty({
    description: 'Items',
    type: NkpItemDto,
    isArray: true,
  })
  @IsNotEmpty()
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => NkpItemDto)
  @ValidateNested({ each: true })
  NkpItem: NkpItemDto[];

  @ApiProperty({
    type: NkpAttachmentDto,
    isArray: true,
  })
  @IsArray()
  @Type(() => NkpAttachmentDto)
  @ValidateNested({ each: true })
  NkpAttachment: NkpAttachmentDto[];
}

export class CloseNkpDto {
  @IsNotEmpty({ message: 'Bank Ref Number is required' })
  bankRefNo: string;

  @IsArray()
  @Type(() => NkpAttachmentDto)
  attachments: NkpAttachmentDto[];
}
