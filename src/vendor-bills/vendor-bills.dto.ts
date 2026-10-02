import { Type } from 'class-transformer';
import {
  IsDateString,
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

  @IsDateString()
  date: string;

  @IsDateString()
  dueDate: string;

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
