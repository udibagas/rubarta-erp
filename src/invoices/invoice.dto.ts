import { InvoiceStatus } from '../prisma/client/client';
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
import { PartialType } from '@nestjs/swagger';

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
  @IsNumber()
  @Min(0)
  discount?: number;

  @IsOptional()
  @IsObject()
  attachments?: Record<string, unknown>;

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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];
}

export class UpdateInvoiceDto extends PartialType(CreateInvoiceDto) {}
