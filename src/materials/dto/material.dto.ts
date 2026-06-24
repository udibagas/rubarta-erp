import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsNumber,
  IsOptional,
  IsBoolean,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateMaterialDto {
  @ApiProperty({ example: 'PART-001' })
  @IsString()
  @MaxLength(100)
  partNumber: string;

  @ApiProperty({ example: 'Steel Plate' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ required: false, example: 'High-quality steel plate' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, example: 'Raw Materials' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiProperty({ example: 'pcs' })
  @IsString()
  @MaxLength(50)
  unit: string;

  @ApiProperty({ required: false, example: 100000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  purchasePrice?: number;

  @ApiProperty({ required: false, example: 150000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sellingPrice?: number;

  @ApiProperty({ required: false, example: 10, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  minStock?: number;

  @ApiProperty({ required: false, example: 100, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  currentStock?: number;

  @ApiProperty({ required: false, example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @IsInt()
  supplierId?: number;
}

export class UpdateMaterialDto extends PartialType(CreateMaterialDto) {}

export class QueryMaterialDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  supplierId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false, description: 'Show only low stock items' })
  @IsOptional()
  @IsBoolean()
  lowStock?: boolean;
}
