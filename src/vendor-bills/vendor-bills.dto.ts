import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
  IsInt,
  Min,
  MinLength,
} from 'class-validator';

export class CreateVendorBillDto {
  @IsString()
  @MinLength(1)
  number: string;

  @IsOptional()
  @IsString()
  vendorRef?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  supplierId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  purchaseOrderId?: number;

  @IsDate({ message: 'Invalid date' })
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  date: Date;

  @IsDate({ message: 'Invalid date' })
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  dueDate: Date;

  @IsOptional()
  @IsString()
  currency?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  subtotal: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  taxAmount?: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  total: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class PostVendorBillDto {
  @IsString()
  @MinLength(1)
  journalNumber: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  periodId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  expenseAccountId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  taxAccountId?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  payableAccountId: number;
}
