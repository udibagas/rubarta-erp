import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { JsonArray } from '@prisma/client/runtime/client';
import { GoodsReceiptStatus, PaymentStatus } from '../prisma/client/client';

export class GoodsReceiptItemDto {
  @ApiProperty({ example: 'PART-001' })
  @IsString({ message: 'Invalid part number' })
  @IsNotEmpty({ message: 'Part number should not be empty' })
  @MaxLength(100, {
    message: 'Part number must be at most 100 characters',
  })
  partNumber: string;

  @ApiProperty({ example: 'SUP-PART-001' })
  @IsString({ message: 'Invalid part number supplier' })
  @IsOptional()
  @MaxLength(100, {
    message: 'Part number supplier must be at most 100 characters',
  })
  partNumberSupplier?: string;

  @ApiProperty({ example: 'Product description' })
  @IsString({ message: 'Invalid description' })
  @IsNotEmpty({ message: 'Description should not be empty' })
  description: string;

  @ApiProperty({ example: 10 })
  @IsInt({ message: 'Invalid quantity order' })
  @Min(1, { message: 'Quantity order must be at least 1' })
  quantityOrder: number;

  @ApiProperty({ example: 10 })
  @IsInt({ message: 'Invalid quantity received' })
  @Min(1, { message: 'Quantity received must be at least 1' })
  quantityReceived: number;
}

export class CreateGoodsReceiptDto {
  @ApiProperty({ example: '2026-09-12' })
  @IsDate({ message: 'Invalid date' })
  @Type(() => Date)
  date: Date;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @IsInt({ message: 'Invalid company' })
  companyId: number;

  @ApiProperty({ example: 1 })
  @IsInt({ message: 'Invalid purchase order' })
  purchaseOrderId: number;

  @ApiProperty({ example: 1 })
  @IsInt({ message: 'Invalid supplier' })
  supplierId: number;

  @ApiProperty({ example: 'John Doe' })
  @IsString({ message: 'Invalid sender' })
  sender: string;

  @ApiProperty({ example: 'Jane Doe' })
  @IsString({ message: 'Invalid recipient' })
  recipient: string;

  @ApiProperty({ example: { files: [] }, type: Object })
  @IsOptional()
  @IsObject({
    each: true,
    message: 'Each supporting document must be an object',
  })
  supportingDocument?: JsonArray;

  @ApiProperty({ example: 'Received in good condition', required: false })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  notes?: string;

  @ApiProperty({ example: 'INV-001', required: false })
  @IsString({ message: 'Invalid vendor invoice number' })
  @MaxLength(100, {
    message:
      'Vendor invoice number is required and must be at most 100 characters',
  })
  vendorInvoiceNumber: string;

  @ApiProperty({ example: 'Draft' })
  @IsString({ message: 'Invalid status' })
  @IsOptional()
  status: 'Draft' | 'Confirmed';

  @ApiProperty({ type: [GoodsReceiptItemDto] })
  @IsArray({ message: 'Items must be an array' })
  @ValidateNested({ each: true, message: 'Each item must be valid' })
  @Type(() => GoodsReceiptItemDto)
  items: GoodsReceiptItemDto[];
}

export class UpdateGoodsReceiptDto extends PartialType(CreateGoodsReceiptDto) {}

export class QueryGoodsReceiptDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber({}, { message: 'Page must be a number' })
  @Type(() => Number)
  page?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber({}, { message: 'Page size must be a number' })
  @Type(() => Number)
  pageSize?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'Keyword must be a string' })
  keyword?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  purchaseOrderId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Supplier ID must be a number' })
  supplierId?: number;

  @ApiProperty({
    required: false,
    type: [String],
    example: ['2024-01-01', '2024-12-31'],
  })
  @IsOptional()
  @IsArray({ message: 'Date range must be an array' })
  @IsString({ each: true, message: 'Each date range value must be a string' })
  dateRange?: string[];

  @ApiProperty({ required: false, enum: GoodsReceiptStatus })
  @IsOptional()
  @IsEnum(GoodsReceiptStatus, {
    each: true,
    message: 'Invalid purchase order status',
  })
  status?: GoodsReceiptStatus | GoodsReceiptStatus[];

  @ApiProperty({ required: false, enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus, {
    each: true,
    message: 'Invalid purchase order payment status',
  })
  paymentStatus?: PaymentStatus | PaymentStatus[];
}
