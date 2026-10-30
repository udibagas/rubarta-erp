import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
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
  IsNumberString,
  IsBoolean,
  IsObject,
  IsDate,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Currency, SalesOrderStatus } from '../prisma/client/client';
import { JsonArray } from '@prisma/client/runtime/client';

export class SalesOrderItemDto {
  @ApiProperty({ example: 'PART-001' })
  @IsString({ message: 'Part number is required and must be a string' })
  @MaxLength(100, { message: 'Part number must be at most 100 characters' })
  partNumber: string;

  @ApiProperty({ example: 'Product description' })
  @IsString({ message: 'Description is required and must be a string' })
  description: string;

  @ApiProperty({ example: 10 })
  @IsInt({ message: 'Quantity is required and must be an integer' })
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;

  @ApiProperty({ required: false, example: 0, default: 0 })
  @IsOptional()
  @IsInt({ message: 'Delivered quantity must be an integer' })
  deliveredQuantity?: number;

  @ApiProperty({ example: 100000 })
  @IsNumber({}, { message: 'Unit price is required and must be a number' })
  @Min(0, { message: 'Unit price must be at least 0' })
  unitPrice: number;

  @ApiProperty({ required: false, example: 0, default: 0 })
  @IsOptional()
  @IsInt({ message: 'Sort order must be an integer' })
  sortOrder?: number;
}

export class CreateSalesOrderDto {
  @ApiProperty({ example: 1 })
  @IsOptional()
  @IsInt({ message: 'Invalid quotation ID' })
  quotationId: number;

  @ApiProperty({ required: true, example: 1 })
  @IsOptional()
  @IsInt({ message: 'Invalid company' })
  companyId: number;

  @ApiProperty({ example: '2025-05-25' })
  @IsDate({ message: 'Invalid date' })
  @Type(() => Date)
  date: Date;

  @ApiProperty({ required: true, example: 'Order for office equipment' })
  @IsString({ message: 'Title is required and must be a string' })
  title: string;

  @ApiProperty({ required: true, example: 'PO1234' })
  @IsString({ message: 'Reference number is required and must be a string' })
  referenceNumber: string;

  @ApiProperty({ required: false, example: 'Order for office equipment' })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @ApiProperty({ required: false, example: true, default: true })
  @IsOptional()
  @IsBoolean({ message: 'Apply VAT must be a boolean' })
  applyVat?: boolean;

  @ApiProperty({ required: false, example: 0, default: 0 })
  @IsOptional()
  @IsNumber({}, { message: 'Discount must be a number' })
  @Min(0, { message: 'Discount must be at least 0' })
  discount?: number;

  @ApiProperty({ enum: SalesOrderStatus, example: SalesOrderStatus.Pending })
  @IsEnum(SalesOrderStatus, {
    message: 'Status must be a valid SalesOrderStatus',
  })
  @IsOptional()
  status: SalesOrderStatus;

  @ApiProperty({ required: false, example: 'Jl. Sudirman No. 123' })
  @IsOptional()
  @IsString({ message: 'Shipping address must be a string' })
  shippingAddress?: string;

  @ApiProperty({ required: false, example: 'Jl. Sudirman No. 123' })
  @IsOptional()
  @IsString({ message: 'Billing address must be a string' })
  billingAddress?: string;

  @ApiProperty({ required: false, example: 'Terms and conditions' })
  @IsOptional()
  @IsString({ message: 'Terms and conditions must be a string' })
  termsAndConditions?: string;

  @ApiProperty({ required: false, example: 'Net 30' })
  @IsOptional()
  @IsString({ message: 'Term of payment must be a string' })
  termOfPayment?: string;

  @ApiProperty({ required: false, example: 'FOB' })
  @IsOptional()
  @IsString({ message: 'Term of delivery must be a string' })
  termOfDelivery?: string;

  @ApiProperty({ required: false, example: 'Credit Card' })
  @IsOptional()
  @IsString({ message: 'Payment method must be a string' })
  paymentMethod?: string;

  @ApiProperty({ enum: Currency, example: Currency.IDR, default: Currency.IDR })
  @IsOptional()
  @IsEnum(Currency, { message: 'Invalid currency' })
  currency?: Currency;

  @ApiProperty({
    required: false,
    example:
      'Sales, Customer Free Program, Lending Of Goods, Fee Service, Warranty, Others',
  })
  @IsOptional()
  @IsString({ message: 'Request type must be a string' })
  requestType?: string;

  @ApiProperty({ required: false, example: '2025-06-01T10:00:00Z' })
  @IsOptional()
  @IsDate({ message: 'Invalid date' })
  @Type(() => Date)
  deliveryDate?: Date;

  @ApiProperty({ required: false, example: 'All Sea' })
  @IsOptional()
  @IsString({ message: 'Delivery method must be a string' })
  deliveryMethod?: string;

  @ApiProperty({ required: false, example: 'Additional notes' })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  notes?: string;

  @ApiProperty({ type: [SalesOrderItemDto] })
  @IsArray({ message: 'Items must be an array' })
  @ValidateNested({ each: true, message: 'Each item must be valid' })
  @Type(() => SalesOrderItemDto)
  items: SalesOrderItemDto[];

  // Customer information
  @ApiProperty({ example: 1 })
  @IsInt({ message: 'Invalid customer' })
  customerId: number;

  @ApiProperty({ required: false, example: '123 Main St, City, Country' })
  @IsOptional()
  @IsString({ message: 'Customer address must be a string' })
  customerAddress: string;

  @ApiProperty({ required: false, example: 'John Doe' })
  @IsOptional()
  @IsString({ message: 'Contact person must be a string' })
  contactPerson: string;

  @ApiProperty({ required: false, example: '+1234567890' })
  @IsOptional()
  @IsString({ message: 'Contact phone must be a string' })
  contactPhone: string;

  @ApiProperty({ required: true, example: 'john.doe@example.com' })
  @IsEmail({}, { message: 'Contact email must be a valid email address' })
  contactEmail: string;

  @ApiProperty({ example: { files: [] }, type: Object })
  @IsOptional()
  @IsObject({ each: true, message: 'Each attachment must be an object' })
  attachments?: JsonArray;
}

export class UpdateSalesOrderDto extends PartialType(CreateSalesOrderDto) {}

export class SendSalesOrderEmailDto {
  @ApiProperty({ example: 'Sales order SO092026-1 for your review' })
  @IsString({ message: 'Subject must be a string' })
  @MaxLength(200, { message: 'Subject must be at most 200 characters' })
  subject: string;

  @ApiProperty({
    example: '<p>Dear customer, please find attached our sales order.</p>',
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

export class QuerySalesOrderDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumberString({}, { message: 'Page must be a numeric string' })
  page?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumberString({}, { message: 'Page size must be a numeric string' })
  pageSize?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'Keyword must be a string' })
  keyword?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumberString({}, { message: 'Customer ID must be a numeric string' })
  customerId?: string;

  @ApiProperty({
    required: false,
    type: [String],
    example: ['2024-01-01', '2024-12-31'],
  })
  @IsOptional()
  @IsArray({ message: 'Date range must be an array' })
  @IsString({ each: true, message: 'Each date range value must be a string' })
  dateRange?: string[];

  @ApiProperty({ required: false, enum: SalesOrderStatus })
  @IsOptional()
  @IsEnum(SalesOrderStatus, {
    each: true,
    message: 'Invalid sales order status',
  })
  status?: SalesOrderStatus | SalesOrderStatus[];
}
