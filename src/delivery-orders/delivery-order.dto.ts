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

export class DeliveryOrderItemDto {
  @ApiProperty({ example: 'PART-001' })
  @IsString()
  @MaxLength(100)
  partNumber: string;

  @ApiProperty({ example: 'SUP-PART-001' })
  @IsString()
  @MaxLength(100)
  partNumberSupply: string;

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
  quantitySupply: number;
}

export class CreateDeliveryOrderDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  companyId: number;

  @ApiProperty({ example: '2026-09-12T10:00:00Z' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  salesOrderId: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  customerId: number;

  @ApiProperty({ required: false, example: 'John Doe' })
  @IsString()
  @IsOptional()
  sender?: string | null;

  @ApiProperty({ required: false, example: 'Jane Doe' })
  @IsString()
  @IsOptional()
  recipient?: string | null;

  @ApiProperty({
    required: false,
    nullable: true,
    example: { files: [] },
    type: Object,
  })
  @IsOptional()
  @IsObject()
  supportingDocument?: JsonArray;

  @ApiProperty({ required: false, example: 'Delivered in good condition' })
  @IsOptional()
  @IsString()
  notes?: string | null;

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
  @IsString()
  keyword?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  salesOrderId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  customerId?: number;
}
