import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
  MaxLength,
  Min,
  ValidateNested,
  IsNumberString,
  IsDate,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  Currency,
  PaymentStatus,
  PurchaseOrderStatus,
} from '../prisma/client/client';

export class PurchaseOrderItemDto {
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

  @ApiProperty({ required: false, example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  receivedQuantity?: number;

  @ApiProperty({ example: 100000 })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiProperty({ required: false, example: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class CreatePurchaseOrderDto {
  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @IsInt({ message: 'Invalid sales order' })
  salesOrderId?: number;

  @ApiProperty({ required: false, example: 'Stock Order' })
  @IsOptional()
  @IsString()
  orderType?: string;

  @ApiProperty({ example: '2026-09-12' })
  @IsDate({ message: 'Invalid date' })
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  date: Date;

  @ApiProperty({ example: 'PO-REF-001' })
  @IsString()
  referenceNumber: string;

  @ApiProperty({ example: 'Purchase of office equipment' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, example: 'IDR' })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiProperty({ required: false, example: true })
  @IsOptional()
  @IsBoolean()
  applyVat?: boolean;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @Transform(({ value }) => (value ? parseFloat(value) : 0))
  @Min(0)
  @IsNumber()
  currencyRate?: number;

  @ApiProperty({ required: false, example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  deliveryMethod?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  destination?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  warehouse?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  packingCondition?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  shippingAddress?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate({ message: 'Invalid date' })
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  deliveryDate?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  termOfDelivery?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  partialShipment?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  termOfPayment?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  supplierAddress?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  billingAddress?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  termsAndConditions?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @IsInt()
  supplierId?: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @IsInt({ message: 'Invalid company' })
  companyId: number;

  @ApiProperty({ type: [PurchaseOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  items: PurchaseOrderItemDto[];

  @ApiProperty({ enum: PurchaseOrderStatus, required: false })
  @IsOptional()
  @IsEnum(PurchaseOrderStatus)
  status?: PurchaseOrderStatus;
}

export class UpdatePurchaseOrderDto extends PartialType(
  CreatePurchaseOrderDto,
) {}

export class QueryPurchaseOrderDto {
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
  supplierId?: string;

  @ApiProperty({
    required: false,
    type: [String],
    example: ['2024-01-01', '2024-12-31'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dateRange?: string[];

  @ApiProperty({ required: false, enum: PurchaseOrderStatus })
  @IsOptional()
  @IsEnum(PurchaseOrderStatus, {
    each: true,
    message: 'Invalid purchase order status',
  })
  status?: PurchaseOrderStatus | PurchaseOrderStatus[];

  @ApiProperty({ required: false, enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus, {
    each: true,
    message: 'Invalid purchase order payment status',
  })
  paymentStatus?: PaymentStatus | PaymentStatus[];
}

export class SendPurchaseOrderEmailDto {
  @ApiProperty({ example: 'Purchase order PO092026-1' })
  @IsString()
  @MaxLength(200)
  subject: string;

  @ApiProperty({ example: '<p>Please find our purchase order attached.</p>' })
  @IsString()
  body: string;

  @ApiProperty({ example: 'supplier@example.com' })
  @IsEmail()
  to: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  cc?: string[];
}
