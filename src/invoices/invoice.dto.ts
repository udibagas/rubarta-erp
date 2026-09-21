import { InvoiceStatus, Currency } from '../prisma/client/client';
import {
  IsNotEmpty,
  IsInt,
  IsEnum,
  IsDateString,
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
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { JsonArray } from '@prisma/client/runtime/client';

export class InvoiceItemDto {
  @IsNotEmpty({ message: 'Part number is required' })
  @IsString()
  partNumber: string;

  @IsNotEmpty({ message: 'Description is required' })
  @IsString()
  description: string;

  @IsNotEmpty({ message: 'Quantity is required' })
  @IsInt()
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreateInvoiceDto {
  @IsDateString()
  date: string;

  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @IsInt()
  salesOrderId: number;

  @IsInt()
  deliveryOrderId: number;

  @IsInt()
  customerId: number;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @IsOptional()
  @IsString()
  currency?: Currency;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @IsOptional()
  @IsBoolean()
  withTaxInvoice?: boolean;

  @IsOptional()
  @IsString()
  taxInvoiceNumber?: string;

  @ApiProperty({ example: { files: [] }, type: Object })
  @IsOptional()
  @IsObject({ each: true })
  attachments?: JsonArray;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  termOfPayment?: string;

  @IsOptional()
  @IsString()
  contactPerson?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  billingAddress?: string;

  @IsOptional()
  @IsString()
  shippingAddress?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];
}

export class UpdateInvoiceDto extends PartialType(CreateInvoiceDto) {}

export class SendInvoiceEmailDto {
  @ApiProperty({ example: 'Invoice INV092026-1 for your review' })
  @IsString()
  @MaxLength(200)
  subject: string;

  @ApiProperty({
    example: '<p>Dear customer, please find attached our invoice.</p>',
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

export class QueryInvoiceDto {
  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  pageSize?: string;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumberString()
  customerId?: string;

  @ApiProperty({
    required: false,
    type: [String],
    example: ['2024-01-01', '2024-12-31'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dateRange?: string[];
}
