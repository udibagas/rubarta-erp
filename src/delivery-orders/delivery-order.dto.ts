import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
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
import { Type } from 'class-transformer';
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
  @IsString()
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

  @ApiProperty({ example: '2026-09-12T10:00:00Z' })
  @IsDateString()
  date: string;

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
  @IsString()
  @IsOptional()
  sender?: string | null;

  @ApiProperty({ required: false, example: 'RCPT-001' })
  @IsString()
  @IsOptional()
  receiptNumber?: string | null;

  @ApiProperty({ required: false, example: 'John Doe' })
  @IsString()
  @IsOptional()
  pickUpBy?: string | null;

  @ApiProperty({ required: false, example: 'Jane Doe' })
  @IsString()
  @IsOptional()
  pickUpName?: string | null;

  @ApiProperty({ required: false, example: '+1 555 0100' })
  @IsString()
  @IsOptional()
  pickUpContact?: string | null;

  @ApiProperty({ example: { files: [] }, type: Object })
  @IsOptional()
  @IsObject({ each: true })
  supportingDocument?: JsonArray;

  @ApiProperty({ required: false, example: 'Delivered in good condition' })
  @IsOptional()
  @IsString()
  notes?: string | null;

  @ApiProperty({ example: 'Draft' })
  @IsOptional()
  @IsString({ message: 'Invalid status' })
  status: 'Draft' | 'Confirmed';

  @ApiProperty({ type: [DeliveryOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliveryOrderItemDto)
  items: DeliveryOrderItemDto[];
}

export class UpdateDeliveryOrderDto extends PartialType(
  CreateDeliveryOrderDto,
) {}

export class QueryDeliveryOrderDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumberString()
  pageSize?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumberString()
  salesOrderId?: string;

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

  @ApiProperty({ required: false, enum: DeliveryOrderStatus })
  @IsOptional()
  @IsEnum(DeliveryOrderStatus, {
    each: true,
    message: 'Invalid delivery order status',
  })
  status?: DeliveryOrderStatus | DeliveryOrderStatus[];
}
