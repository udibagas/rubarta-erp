import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsDateString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SalesOrderStatus } from '../prisma/client/client';

export class SalesOrderItemDto {
  @ApiProperty({ example: 'PART-001' })
  @IsString()
  @MaxLength(100)
  partNumber: string;

  @ApiProperty({ example: 'Product description' })
  @IsString()
  description: string;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 100000 })
  @IsNumber({}, { message: 'Unit price must be number' })
  @Min(0)
  unitPrice: number;

  @ApiProperty({ required: false, example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class CreateSalesOrderDto {
  @ApiProperty({ example: '2025-05-25T10:00:00Z' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  customerId: number;

  @ApiProperty({ required: true, example: 'Order for office equipment' })
  @IsString()
  title: string;

  @ApiProperty({ required: true, example: 'PO1234' })
  @IsString()
  referenceNumber: string;

  @ApiProperty({ required: false, example: 'Order for office equipment' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, example: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiProperty({ enum: SalesOrderStatus, example: SalesOrderStatus.Pending })
  @IsEnum(SalesOrderStatus)
  @IsOptional()
  status: SalesOrderStatus;

  @ApiProperty({ required: false, example: 'Jl. Sudirman No. 123' })
  @IsOptional()
  @IsString()
  shippingAddress?: string;

  @ApiProperty({ required: false, example: 'Jl. Sudirman No. 123' })
  @IsOptional()
  @IsString()
  billingAddress?: string;

  @ApiProperty({ required: false, example: 'NET 30' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  paymentTerms?: string;

  @ApiProperty({ required: false, example: '2025-06-01T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  deliveryDate?: string;

  @ApiProperty({ required: false, example: 'All Sea' })
  @IsOptional()
  @IsString()
  deliveryMethod?: string;

  @ApiProperty({ required: false, example: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [SalesOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalesOrderItemDto)
  items: SalesOrderItemDto[];
}

export class UpdateSalesOrderDto extends PartialType(CreateSalesOrderDto) {}

export class QuerySalesOrderDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  customerId?: number;

  @ApiProperty({ required: false, enum: SalesOrderStatus })
  @IsOptional()
  @IsEnum(SalesOrderStatus)
  status?: SalesOrderStatus;
}
