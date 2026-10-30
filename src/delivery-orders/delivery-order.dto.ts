import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { JsonArray } from '@prisma/client/runtime/client';
import { DeliveryOrderStatus } from '../prisma/client/client';

export class DeliveryOrderItemDto {
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
  partNumberSupply: string;

  @ApiProperty({ example: 'Product description' })
  @IsString({ message: 'Description must be a string' })
  description: string;

  @ApiProperty({ example: 10 })
  @IsInt({ message: 'Invalid quantity order' })
  @Min(1, { message: 'Quantity order must be at least 1' })
  quantityOrder: number;

  @ApiProperty({ example: 10 })
  @IsInt({ message: 'Invalid quantity supply' })
  @Min(1, { message: 'Quantity supply must be at least 1' })
  quantitySupply: number;
}

export class CreateDeliveryOrderDto {
  @ApiProperty({ example: 1 })
  @IsInt({ message: 'Invalid company' })
  companyId: number;

  @ApiProperty({ example: '2026-09-12' })
  @IsDate({ message: 'Invalid date' })
  @Type(() => Date)
  date: Date;

  @ApiProperty({ example: 1 })
  @IsInt({ message: 'Invalid SO number' })
  salesOrderId: number;

  @ApiProperty({ example: 1 })
  @IsInt({ message: 'Invalid customer' })
  customerId: number;

  @ApiProperty({ example: 1 })
  @IsInt({ message: 'Invalid GR number' })
  goodsReceiptId: number;

  @ApiProperty({ required: false, example: 'John Doe' })
  @IsString({ message: 'Sender must be a string' })
  @IsOptional()
  sender?: string | null;

  @ApiProperty({ required: false, example: 'RCPT-001' })
  @IsString({ message: 'Receipt number must be a string' })
  @IsOptional()
  receiptNumber?: string | null;

  @ApiProperty({ required: false, example: 'REF-001' })
  @IsString({ message: 'Reference number must be a string' })
  @IsOptional()
  referenceNumber?: string | null;

  @ApiProperty({ required: false, example: 'John Doe' })
  @IsString({ message: 'Pickup by must be a string' })
  @IsOptional()
  pickUpBy?: string | null;

  @ApiProperty({ required: false, example: 'Jane Doe' })
  @IsString({ message: 'Pickup name must be a string' })
  @IsOptional()
  pickUpName?: string | null;

  @ApiProperty({ required: false, example: '+1 555 0100' })
  @IsString({ message: 'Pickup contact must be a string' })
  @IsOptional()
  pickUpContact?: string | null;

  @ApiProperty({ example: { files: [] }, type: Object })
  @IsOptional()
  @IsObject({
    each: true,
    message: 'Each supporting document must be an object',
  })
  supportingDocument?: JsonArray;

  @ApiProperty({ required: false, example: 'Delivered in good condition' })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  notes?: string | null;

  @ApiProperty({ example: 'Draft' })
  @IsOptional()
  @IsString({ message: 'Invalid status' })
  status: 'Draft' | 'Confirmed';

  @ApiProperty({ type: [DeliveryOrderItemDto] })
  @IsArray({ message: 'Items must be an array' })
  @ValidateNested({ each: true, message: 'Each item must be valid' })
  @Type(() => DeliveryOrderItemDto)
  items: DeliveryOrderItemDto[];
}

export class UpdateDeliveryOrderDto extends PartialType(
  CreateDeliveryOrderDto,
) {}

export class QueryDeliveryOrderDto {
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
  @IsNumberString({}, { message: 'Sales order ID must be a numeric string' })
  salesOrderId?: string;

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

  @ApiProperty({ required: false, enum: DeliveryOrderStatus })
  @IsOptional()
  @IsEnum(DeliveryOrderStatus, {
    each: true,
    message: 'Invalid delivery order status',
  })
  status?: DeliveryOrderStatus | DeliveryOrderStatus[];
}
