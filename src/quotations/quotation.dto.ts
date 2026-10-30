import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsString,
  IsInt,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  MaxLength,
  Min,
  IsEmail,
  IsBoolean,
  IsDate,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuotationStatus, Currency } from '../prisma/client/client';
export class QuotationItemDto {
  @ApiProperty({ example: 'PART-001' })
  @IsString()
  @IsNotEmpty({ message: 'Part number is required' })
  @MaxLength(100)
  partNumber: string;

  @ApiProperty({ example: 'Product Name' })
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiProperty({ example: 'Product Model' })
  @IsOptional()
  @IsString()
  model: string;

  @ApiProperty({ example: 'Product description' })
  @IsOptional()
  @IsString()
  description: string;

  @ApiProperty({ example: 10 })
  @IsInt({ message: 'Quantity must be an integer' })
  @Min(1, { message: 'Quantity must be at least 1' })
  @IsNotEmpty({ message: 'Quantity is required' })
  quantity: number;

  @ApiProperty({ required: false, example: 1, default: 1 })
  @IsOptional()
  @IsInt({ message: 'MOQ must be an integer' })
  @Min(0)
  moq?: number;

  @ApiProperty({ example: 100000 })
  @IsNumber()
  @Min(1, { message: 'Unit price must be at least 1' })
  unitPrice: number;

  @ApiProperty({ required: false, example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
export class CreateQuotationDto {
  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @IsInt({ message: 'Invalid company' })
  companyId?: number;

  @ApiProperty({ example: '2025-06-25' })
  @IsDate({ message: 'Invalid date' })
  @Type(() => Date)
  date: Date;

  @ApiProperty({ example: 'Quotation for Office Equipment' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({ required: false, example: 'Detailed description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  customerId: number;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @IsInt()
  opportunityId?: number;

  @ApiProperty({ enum: Currency, example: Currency.IDR, default: Currency.IDR })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiProperty({ required: false, example: 30, default: 30 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  validity?: number;

  @ApiProperty({ example: '2025-06-25' })
  @IsDate({ message: 'Invalid date' })
  @Type(() => Date)
  validUntil: Date;

  @ApiProperty({ required: false, example: true, default: true })
  @IsOptional()
  @IsBoolean()
  applyVat?: boolean;

  @ApiProperty({ required: false, example: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiProperty({ required: false, example: 'Terms and conditions' })
  @IsOptional()
  @IsString()
  termsAndConditions?: string;

  @ApiProperty({ required: false, example: 'Net 30' })
  @IsOptional()
  @IsString()
  termOfPayment?: string;

  @ApiProperty({ required: false, example: 'FOB' })
  @IsOptional()
  @IsString()
  termOfDelivery?: string;

  @ApiProperty({ required: false, example: 'Credit Card' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiProperty({
    required: false,
    example:
      'Sales, Customer Free Program, Lending Of Goods, Fee Service, Warranty, Others',
  })
  @IsOptional()
  @IsString()
  requestType?: string;

  @ApiProperty({ required: false, example: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false, example: '123 Main St, City, Country' })
  @IsOptional()
  @IsString()
  customerAddress: string;

  @ApiProperty({ required: false, example: 'John Doe' })
  @IsOptional()
  @IsString()
  contactPerson: string;

  @ApiProperty({ required: false, example: '+1234567890' })
  @IsOptional()
  @IsString()
  contactPhone: string;

  @ApiProperty({ required: true, example: 'john.doe@example.com' })
  @IsEmail()
  contactEmail: string;

  @ApiProperty({ type: [QuotationItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuotationItemDto)
  items: QuotationItemDto[];

  @IsOptional()
  @IsArray({ message: 'Attachments must be an array' })
  attachments?: Record<string, any>[];

  @ApiProperty({ enum: QuotationStatus, required: false })
  @IsOptional()
  @IsEnum(QuotationStatus)
  status?: QuotationStatus;
}

export class UpdateQuotationDto extends PartialType(CreateQuotationDto) {}
export class SendQuotationEmailDto {
  @ApiProperty({ example: 'Quotation QUO092026-1 for your review' })
  @IsString()
  @MaxLength(200)
  subject: string;

  @ApiProperty({
    example: '<p>Dear customer, please find attached our quotation.</p>',
  })
  @IsString()
  body: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  to: string;

  @ApiProperty({
    required: false,
    type: [String],
    example: ['manager@example.com'],
  })
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  cc?: string[];
}
export class QueryQuotationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pageSize?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  customerId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  opportunityId?: number;

  @ApiProperty({
    required: false,
    type: [String],
    example: ['2024-01-01', '2024-12-31'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dateRange?: string[];

  @ApiProperty({ required: false, enum: QuotationStatus })
  @IsOptional()
  @IsEnum(QuotationStatus, { each: true, message: 'Invalid quotation status' })
  status?: QuotationStatus | QuotationStatus[];
}
