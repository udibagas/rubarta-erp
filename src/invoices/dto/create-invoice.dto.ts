import { InvoiceStatus } from '../../prisma/client/client';
import {
  IsNotEmpty,
  IsInt,
  IsEnum,
  IsDateString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsString,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export class InvoiceItemDto {
  @IsNotEmpty({ message: 'Description is required' })
  @IsString()
  description: string;

  @IsNotEmpty({ message: 'Quantity is required' })
  @IsInt()
  quantity: number;

  @IsNotEmpty({ message: 'Unit price is required' })
  @IsNumber()
  unitPrice: number;

  @IsNotEmpty({ message: 'Total price is required' })
  @IsNumber()
  totalPrice: number;

  @IsOptional()
  @IsBoolean()
  vat?: boolean;
}

export class CreateInvoiceDto {
  userId: number;

  @IsNotEmpty({ message: 'Invoice number is required' })
  @IsString()
  number: string;

  @IsNotEmpty({ message: 'Date is required' })
  @IsDateString()
  date: string;

  @IsNotEmpty({ message: 'Due date is required' })
  @IsDateString()
  dueDate: string;

  @IsNotEmpty({ message: 'Order ID is required' })
  @IsInt()
  orderId: number;

  @IsNotEmpty({ message: 'Customer ID is required' })
  @IsInt()
  customerId: number;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @IsNotEmpty({ message: 'Total amount is required' })
  @IsNumber()
  totalAmount: number;

  @IsNotEmpty({ message: 'VAT amount is required' })
  @IsNumber()
  vatAmount: number;

  @IsNotEmpty({ message: 'Grand total is required' })
  @IsNumber()
  grandTotal: number;

  @IsOptional()
  @IsObject()
  attachments?: Record<string, any>;

  @IsNotEmpty({ message: 'Invoice items are required' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];
}
