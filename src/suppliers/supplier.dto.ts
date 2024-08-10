import { Currency } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class SupplierDto {
  code: string;

  @IsString({ message: 'Name is required' })
  name: string;

  @IsString({ message: 'Address is required' })
  address: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsEmail({}, { message: 'Invalid email' })
  @IsOptional()
  @IsString()
  email?: string;

  @IsNumber({}, { message: 'Invalid Bank' })
  bankId: number;

  @IsString({ message: 'Bank Account is required' })
  bankAccount: string;

  @IsEnum(Currency, { message: 'Invalid currency' })
  currency: Currency;
}
