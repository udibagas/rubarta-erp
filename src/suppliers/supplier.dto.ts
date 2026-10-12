import { Currency } from '../prisma/client/client';
import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';

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

  @IsOptional()
  @IsString({ message: 'Bank Account Holder is required' })
  bankAccountHolder?: string;

  @IsEnum(Currency, { message: 'Invalid currency' })
  currency: Currency;

  @ApiProperty({ description: 'User status', example: true })
  @IsBoolean({ message: 'Invalid status' })
  @IsOptional()
  active?: boolean;
}

export class UpdateSupplierDto extends PartialType(CreateSupplierDto) {}

export class QuerySupplierDto {
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @IsNumber()
  page?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @IsNumber()
  pageSize?: number;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
