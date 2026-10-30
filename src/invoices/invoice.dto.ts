import { InvoiceStatus, Currency } from '../prisma/client/client';
import {
  IsNotEmpty,
  IsInt,
  IsEnum,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsString,
  IsObject,
  Min,
  IsNumberString,
  IsEmail,
  MaxLength,
  IsBoolean,
  IsDate,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { JsonArray, JsonObject } from '@prisma/client/runtime/client';

export class InvoiceItemDto {
  @IsNotEmpty({ message: 'Part number is required' })
  @IsString({ message: 'Part number must be a string' })
  partNumber: string;

  @IsNotEmpty({ message: 'Description is required' })
  @IsString({ message: 'Description must be a string' })
  description: string;

  @IsNotEmpty({ message: 'Quantity is required' })
  @IsInt({ message: 'Quantity must be an integer' })
  quantity: number;

  @IsNumber({}, { message: 'Unit price must be a number' })
  @Min(0, { message: 'Unit price must be at least 0' })
  unitPrice: number;
}

export class CreateInvoiceDto {
  @ApiProperty({ required: true, example: 1 })
  @IsOptional()
  @IsInt({ message: 'Invalid company' })
  companyId?: number;

  @IsDate({ message: 'Invalid date' })
  @Type(() => Date)
  date: Date;

  @IsDate({ message: 'Invalid date' })
  @Type(() => Date)
  dueDate: Date;

  @IsOptional()
  @IsString({ message: 'Reference number must be a string' })
  referenceNumber?: string;

  @IsInt({ message: 'Invalid sales order' })
  salesOrderId: number;

  @IsInt({ message: 'Invalid delivery order' })
  deliveryOrderId: number;

  @IsInt({ message: 'Invalid customer' })
  customerId: number;

  @IsOptional()
  @IsEnum(InvoiceStatus, { message: 'Invalid invoice status' })
  status?: InvoiceStatus;

  @IsOptional()
  @IsString({ message: 'Currency must be a string' })
  currency?: Currency;

  @ApiProperty({ type: Object })
  @IsOptional()
  @IsObject({ message: 'Bank details must be an object' })
  bank?: JsonObject;

  @IsOptional()
  @IsNumber({}, { message: 'Discount must be a number' })
  @Min(0, { message: 'Discount must be at least 0' })
  discount?: number;

  @IsOptional()
  @IsBoolean({ message: 'With tax invoice must be a boolean' })
  withTaxInvoice?: boolean;

  @IsOptional()
  @IsString({ message: 'Tax invoice number must be a string' })
  taxInvoiceNumber?: string;

  @ApiProperty({ example: { files: [] }, type: Object })
  @IsOptional()
  @IsObject({ each: true, message: 'Each attachment must be an object' })
  attachments?: JsonArray;

  @IsOptional()
  @IsString({ message: 'Payment method must be a string' })
  paymentMethod?: string;

  @IsOptional()
  @IsString({ message: 'Term of payment must be a string' })
  termOfPayment?: string;

  @IsOptional()
  @IsString({ message: 'Contact person must be a string' })
  contactPerson?: string;

  @IsOptional()
  @IsString({ message: 'Contact phone must be a string' })
  contactPhone?: string;

  @IsOptional()
  @IsString({ message: 'Contact email must be a string' })
  contactEmail?: string;

  @IsOptional()
  @IsString({ message: 'Billing address must be a string' })
  billingAddress?: string;

  @IsOptional()
  @IsString({ message: 'Shipping address must be a string' })
  shippingAddress?: string;

  @IsArray({ message: 'Items must be an array' })
  @ValidateNested({ each: true, message: 'Each item must be valid' })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];
}

export class UpdateInvoiceDto extends PartialType(CreateInvoiceDto) {}

export class InvoiceStatusUpdateDto {
  @IsEnum(InvoiceStatus, { message: 'Invalid invoice status' })
  status: InvoiceStatus;

  @IsOptional()
  @IsString({ message: 'Receipt number must be a string' })
  receiptNumber?: string;

  @IsOptional()
  @IsDate({ message: 'Invalid date' })
  @Type(() => Date)
  receiptDate?: Date;

  @IsOptional()
  @IsObject({ each: true, message: 'Each receipt file must be an object' })
  receiptFile?: JsonArray;
}

export class SendInvoiceEmailDto {
  @ApiProperty({ example: 'Invoice INV092026-1 for your review' })
  @IsString({ message: 'Subject must be a string' })
  @MaxLength(200, { message: 'Subject must be at most 200 characters' })
  subject: string;

  @ApiProperty({
    example: '<p>Dear customer, please find attached our invoice.</p>',
  })
  @IsString({ message: 'Body must be a string' })
  body: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail({}, { message: 'Recipient must be a valid email address' })
  to: string;

  @ApiProperty({
    required: false,
    type: [String],
    example: ['manager@example.com'],
  })
  @IsOptional()
  @IsArray({ message: 'CC must be an array' })
  @IsEmail(
    {},
    { each: true, message: 'Each CC address must be a valid email address' },
  )
  cc?: string[];
}

export class QueryInvoiceDto {
  @IsOptional()
  @IsNumberString({}, { message: 'Page must be a numeric string' })
  page?: string;

  @IsOptional()
  @IsNumberString({}, { message: 'Page size must be a numeric string' })
  pageSize?: string;

  @IsOptional()
  @IsEnum(InvoiceStatus, { each: true, message: 'Invalid invoice status' })
  status?: InvoiceStatus | InvoiceStatus[];

  @IsOptional()
  @IsString({ message: 'Keyword must be a string' })
  keyword?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumberString({}, { message: 'Customer ID must be a numeric string' })
  customerId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumberString({}, { message: 'Sales order ID must be a numeric string' })
  salesOrderId?: string;

  @ApiProperty({
    required: false,
    type: [String],
    example: ['2024-01-01', '2024-12-31'],
  })
  @IsOptional()
  @IsArray({ message: 'Date range must be an array' })
  @IsString({ each: true, message: 'Each date range value must be a string' })
  dateRange?: string[];
}
