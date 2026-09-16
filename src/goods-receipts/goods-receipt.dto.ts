import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { JsonArray } from '@prisma/client/runtime/client';

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
  @IsNotEmpty({ message: 'Part number supplier should not be empty' })
  @MaxLength(100, {
    message: 'Part number supplier must be at most 100 characters',
  })
  partNumberSupplier: string;

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
  @ApiProperty({ example: '2026-09-12T10:00:00Z' })
  @IsDateString()
  date: string;

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
  @IsObject({ each: true })
  supportingDocument?: JsonArray;

  @ApiProperty({ example: 'Received in good condition', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: 'Draft' })
  @IsString({ message: 'Invalid status' })
  @IsOptional()
  status: 'Draft' | 'Confirmed';

  @ApiProperty({ type: [GoodsReceiptItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GoodsReceiptItemDto)
  items: GoodsReceiptItemDto[];
}

export class UpdateGoodsReceiptDto extends PartialType(CreateGoodsReceiptDto) {}

export class QueryGoodsReceiptDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  purchaseOrderId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  supplierId?: number;
}
