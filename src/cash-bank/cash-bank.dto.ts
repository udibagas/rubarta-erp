import { Transform, Type } from 'class-transformer';
import { PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsInt,
  Min,
  MinLength,
  IsDate,
} from 'class-validator';
import { CashBankType, PaymentDirection } from '../prisma/client/client';

export class CreateCashBankAccountDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsEnum(CashBankType)
  type: CashBankType;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  accountId: number;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  accountNumber?: string;

  @IsOptional()
  @IsString()
  accountHolder?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  openingBalance?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateBankTransactionDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cashBankAccountId: number;

  @IsDate({ message: 'Invalid date' })
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  date: Date;

  @IsString()
  @MinLength(1)
  description: string;

  @IsEnum(PaymentDirection)
  type: PaymentDirection;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  offsetAccountId: number;

  @IsString()
  @MinLength(1)
  journalNumber: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  periodId: number;
}

export class UpdateCashBankAccountDto extends PartialType(
  CreateCashBankAccountDto,
) {}
