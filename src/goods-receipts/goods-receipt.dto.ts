import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsInt,
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
  @IsString()
  @MaxLength(100)
  partNumber: string;

  @ApiProperty({ example: 'SUP-PART-001' })
  @IsString()
  @MaxLength(100)
  partNumberSupplier: string;

  @ApiProperty({ example: 'Product description' })
  @IsString()
  description: string;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(0)
  quantityOrder: number;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(0)
  quantityReceived: number;
}

export class CreateGoodsReceiptDto {
  @ApiProperty({ example: '2026-09-12T10:00:00Z' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  companyId: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  purchaseOrderId: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  supplierId: number;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  sender: string;

  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  recipient: string;

  @ApiProperty({ example: { files: [] }, type: Object })
  @IsOptional()
  @IsObject()
  supportingDocument?: JsonArray;

  @ApiProperty({ example: 'Received in good condition', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

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
