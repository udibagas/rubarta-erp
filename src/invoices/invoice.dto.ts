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
