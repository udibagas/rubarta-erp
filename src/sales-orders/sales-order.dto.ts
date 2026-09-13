import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsDateString,
  MaxLength,
  Min,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Currency, SalesOrderStatus } from '../prisma/client/client';

export class SalesOrderItemDto {
  @ApiProperty({ example: 'PART-001' })
  @IsString({ message: 'Part number is required and must be a string' })
  @MaxLength(100)
  partNumber: string;

  @ApiProperty({ example: 'Product description' })
  @IsString({ message: 'Description is required and must be a string' })
  description: string;

  @ApiProperty({ example: 10 })
  @IsInt({ message: 'Quantity is required and must be an integer' })
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 100000 })
  @IsNumber({}, { message: 'Unit price is required and must be a number' })
  @Min(0)
  unitPrice: number;

  @ApiProperty({ required: false, example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class CreateSalesOrderDto {
  @ApiProperty({ example: 1 })
  @IsOptional()
  @IsInt({ message: 'Quotation ID must be an integer' })
  quotationId: number;

  @ApiProperty({ required: true, example: 1 })
  @IsInt({ message: 'Company is required and must be an integer' })
  companyId: number;

  @ApiProperty({ example: '2025-05-25T10:00:00Z' })
  @IsDateString(
    {},
    {
      message: 'Date is required and must be a valid ISO 8601 date string',
    },
  )
  date: string;

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

  @ApiProperty({ required: false, example: 0, default: 0 })
  @IsOptional()
  @IsNumber({}, { message: 'Discount must be a number' })
  @Min(0)
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
  @IsEnum(Currency)
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
  @IsDateString(
    {},
    { message: 'Delivery date must be a valid ISO 8601 date string' },
  )
  deliveryDate?: string;

  @ApiProperty({ required: false, example: 'All Sea' })
  @IsOptional()
  @IsString({ message: 'Delivery method must be a string' })
  deliveryMethod?: string;

  @ApiProperty({ required: false, example: 'Additional notes' })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  notes?: string;

  @ApiProperty({ type: [SalesOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalesOrderItemDto)
  items: SalesOrderItemDto[];

  // Customer information
  @ApiProperty({ example: 1 })
  @IsInt({ message: 'Customer ID is required and must be an integer' })
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
}

export class UpdateSalesOrderDto extends PartialType(CreateSalesOrderDto) {}

export class SendSalesOrderEmailDto {
  @ApiProperty({ example: 'Sales order SO092026-1 for your review' })
  @IsString()
  @MaxLength(200)
  subject: string;

  @ApiProperty({
    example: '<p>Dear customer, please find attached our sales order.</p>',
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

export class QuerySalesOrderDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  customerId?: number;

  @ApiProperty({ required: false, enum: SalesOrderStatus })
  @IsOptional()
  @IsEnum(SalesOrderStatus)
  status?: SalesOrderStatus;
}
