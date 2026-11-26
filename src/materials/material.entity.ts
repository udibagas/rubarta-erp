import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

class Supplier {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;
}

export class MaterialPrice {
  @ApiProperty()
  id: number;

  @ApiProperty()
  supplierId: number;

  @ApiProperty()
  materialId: number;

  @ApiProperty()
  @Type(() => Number)
  purchasePrice: number;

  @ApiProperty()
  currency: string;

  @ApiPropertyOptional({ type: Date, nullable: true })
  startDate?: Date | null;

  @ApiPropertyOptional({ type: Date, nullable: true })
  endDate?: Date | null;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;

  @ApiPropertyOptional({ type: () => Supplier })
  @Type(() => Supplier)
  Supplier?: Supplier;
}

export class SupplierMaterial {
  @ApiProperty()
  id: number;

  @ApiProperty()
  supplierId: number;

  @ApiProperty()
  materialId: number;

  @ApiPropertyOptional({ type: () => Supplier })
  @Type(() => Supplier)
  Supplier?: Supplier;
}

export class Material {
  @ApiProperty()
  id: number;

  @ApiProperty()
  partNumber: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  interchangePartNumber?: string | null;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  model?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  description?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  category?: string | null;

  @ApiProperty()
  unit: string;

  @ApiPropertyOptional({ type: Number, nullable: true })
  weight?: number | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  purchaseCurrency?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  sellingCurrency?: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  purchasePrice?: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  sellingPrice?: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  moq?: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  minStock?: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  currentStock?: number | null;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional({ type: Number, nullable: true })
  supplierId?: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  leadTime?: number | null;

  @ApiPropertyOptional({ type: Date, nullable: true })
  deletedAt?: Date | null;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiPropertyOptional({ type: Date })
  updatedAt?: Date;

  @ApiPropertyOptional({ type: () => Supplier, nullable: true })
  @Type(() => Supplier)
  Supplier?: Supplier | null;

  @ApiPropertyOptional({ type: () => [SupplierMaterial] })
  @Type(() => SupplierMaterial)
  SupplierMaterial?: SupplierMaterial[];

  @ApiPropertyOptional({ type: () => [MaterialPrice] })
  @Type(() => MaterialPrice)
  materialPrices?: MaterialPrice[];

  @ApiPropertyOptional({ type: () => [Number] })
  supplierIds?: number[];

  @ApiPropertyOptional({ type: () => [String] })
  suppliers?: string[];
}
