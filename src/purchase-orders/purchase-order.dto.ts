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
  @IsString({ message: 'Part number must be a string' })
  @MaxLength(100, { message: 'Part number must be at most 100 characters' })
  partNumber: string;

  @ApiProperty({ example: 'Product description' })
  @IsString({ message: 'Description must be a string' })
  description: string;

  @ApiProperty({ example: 10 })
  @IsInt({ message: 'Quantity must be an integer' })
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;

  @ApiProperty({ required: false, example: 0, default: 0 })
  @IsOptional()
  @IsInt({ message: 'Received quantity must be an integer' })
  receivedQuantity?: number;

  @ApiProperty({ example: 100000 })
  @IsNumber({}, { message: 'Unit price must be a number' })
  @Min(0, { message: 'Unit price must be at least 0' })
  unitPrice: number;

  @ApiProperty({ required: false, example: 0 })
  @IsOptional()
  @IsInt({ message: 'Sort order must be an integer' })
  sortOrder?: number;
}

export class CreatePurchaseOrderDto {
  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @IsInt({ message: 'Invalid sales order' })
  salesOrderId?: number;

  @ApiProperty({ required: false, example: 'Stock Order' })
  @IsOptional()
  @IsString({ message: 'Order type must be a string' })
  orderType?: string;

  @ApiProperty({ example: '2026-09-12' })
  @IsDate({ message: 'Invalid date' })
  @Type(() => Date)
  date: Date;

  @ApiProperty({ example: 'PO-REF-001' })
  @IsString({ message: 'Reference number must be a string' })
  referenceNumber: string;

  @ApiProperty({ example: 'Purchase of office equipment' })
  @IsString({ message: 'Title must be a string' })
  @MaxLength(200, { message: 'Title must be at most 200 characters' })
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @ApiProperty({ required: false, example: 'IDR' })
  @IsOptional()
  @IsEnum(Currency, { message: 'Invalid currency' })
  currency?: Currency;

  @ApiProperty({ required: false, example: true })
  @IsOptional()
  @IsBoolean({ message: 'Apply VAT must be a boolean' })
  applyVat?: boolean;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @Min(0, { message: 'Currency rate must be at least 0' })
  @IsNumber({}, { message: 'Currency rate must be a number' })
  currencyRate?: number;

  @ApiProperty({ required: false, example: 0 })
  @IsOptional()
  @IsNumber({}, { message: 'Discount must be a number' })
  @Min(0, { message: 'Discount must be at least 0' })
  discount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'Delivery method must be a string' })
  deliveryMethod?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'Destination must be a string' })
  destination?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'Warehouse must be a string' })
  warehouse?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'Packing condition must be a string' })
  packingCondition?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'Shipping address must be a string' })
  shippingAddress?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate({ message: 'Invalid date' })
  @Type(() => Date)
  deliveryDate?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'Term of delivery must be a string' })
  termOfDelivery?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean({ message: 'Partial shipment must be a boolean' })
  partialShipment?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'Payment method must be a string' })
  paymentMethod?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'Term of payment must be a string' })
  termOfPayment?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'Supplier address must be a string' })
  supplierAddress?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'Billing address must be a string' })
  billingAddress?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'Terms and conditions must be a string' })
  termsAndConditions?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  notes?: string;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @IsInt({ message: 'Invalid supplier' })
  supplierId?: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @IsInt({ message: 'Invalid company' })
  companyId: number;

  @ApiProperty({ type: [PurchaseOrderItemDto] })
  @IsArray({ message: 'Items must be an array' })
  @ValidateNested({ each: true, message: 'Each item must be valid' })
  @Type(() => PurchaseOrderItemDto)
  items: PurchaseOrderItemDto[];

  @ApiProperty({ enum: PurchaseOrderStatus, required: false })
  @IsOptional()
  @IsEnum(PurchaseOrderStatus, { message: 'Invalid purchase order status' })
  status?: PurchaseOrderStatus;

  @ApiProperty({ required: false, enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus, { message: 'Invalid purchase order payment status' })
  paymentStatus?: PaymentStatus;

  @ApiProperty({ required: false, example: 0 })
  @IsOptional()
  @IsNumber({}, { message: 'Payment amount must be a number' })
  @Min(0, { message: 'Payment amount must be at least 0' })
  paymentAmount?: number;
}

export class UpdatePurchaseOrderDto extends PartialType(
  CreatePurchaseOrderDto,
) {}

export class UpdatePurchaseOrderStatusDto {
  @ApiProperty({ enum: PurchaseOrderStatus })
  @IsEnum(PurchaseOrderStatus, { message: 'Invalid purchase order status' })
  status: PurchaseOrderStatus;
}

export class UpdatePurchaseOrderPaymentStatusDto {
  @ApiProperty({ enum: PaymentStatus })
  @IsEnum(PaymentStatus, { message: 'Invalid purchase order payment status' })
  paymentStatus: PaymentStatus;

  @ApiProperty({ required: false, example: 0 })
  @IsOptional()
  @IsNumber({}, { message: 'Payment amount must be a number' })
  @Min(0, { message: 'Payment amount must be at least 0' })
  paymentAmount?: number;
}

export class QueryPurchaseOrderDto {
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
  @IsNumberString({}, { message: 'Supplier ID must be a numeric string' })
  supplierId?: string;

  @ApiProperty({
    required: false,
    type: [String],
    example: ['2024-01-01', '2024-12-31'],
  })
  @IsOptional()
  @IsArray({ message: 'Date range must be an array' })
  @IsString({ each: true, message: 'Each date range value must be a string' })
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
  @IsString({ message: 'Subject must be a string' })
  @MaxLength(200, { message: 'Subject must be at most 200 characters' })
  subject: string;

  @ApiProperty({ example: '<p>Please find our purchase order attached.</p>' })
  @IsString({ message: 'Body must be a string' })
  body: string;

  @ApiProperty({ example: 'supplier@example.com' })
  @IsEmail({}, { message: 'Recipient must be a valid email address' })
  to: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray({ message: 'CC must be an array' })
  @IsEmail(
    {},
    { each: true, message: 'Each CC address must be a valid email address' },
  )
  cc?: string[];
}
