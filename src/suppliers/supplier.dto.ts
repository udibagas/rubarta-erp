import { Currency } from '../prisma/client/client';
import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateSupplierDto {
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

export class UpdateSupplierDto extends PartialType(CreateSupplierDto) { }

export class QuerySupplierDto {
  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  pageSize?: string;

  @IsOptional()
  @IsString()
  keyword?: string;
}
