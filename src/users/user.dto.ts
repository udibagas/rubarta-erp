import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Currency, Role } from '../prisma/client/client';
import { IsNumberString } from 'class-validator';
import { JsonObject } from 'type-fest';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  Length,
} from 'class-validator';

export class UserRole {
  @IsNotEmpty()
  role: string;
}

export class CreateUserDto {
  code: string;

  @ApiProperty({
    example: 'Bagas Udi S.',
  })
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiProperty({
    example: 'bagas@mail.com',
  })
  @IsEmail({}, { message: 'Invalid email' })
  email: string;

  @ApiProperty({
    example: 'secret123',
  })
  @IsNotEmpty({ message: 'Password is required' })
  @Length(8, undefined, { message: 'Minimum password 8 is characters' })
  password: string;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  bankId: number;

  @ApiProperty({ required: false, example: '2411191***' })
  @IsOptional()
  bankAccount: string;

  @IsEnum(Currency, { message: 'Invalid currency' })
  currency: Currency;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  departmentId?: number;

  @ApiProperty({ description: 'Signature' })
  @IsOptional()
  @IsObject({ message: 'Invalid object' })
  signatureSpeciment?: JsonObject;

  @ApiProperty({ example: ['ADMIN', 'USER', 'SALES_REP'], enum: Role })
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(Role, { each: true, message: 'Invalid Role' })
  roles: Role[];

  @ApiProperty({ description: 'User status', example: true })
  @IsBoolean({ message: 'Invalid status' })
  @IsOptional()
  active?: boolean;
}

export class UpdateUserDto extends PartialType(CreateUserDto) { }

export class QueryUserDto {
  @ApiProperty({ required: false, example: 'Bagas Udi S.' })
  @IsOptional()
  keyword?: string;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @IsNumberString({}, { message: 'Page must be a number' })
  page?: string;

  @ApiProperty({ required: false, example: 10 })
  @IsOptional()
  @IsNumberString({}, { message: 'Page size must be a number' })
  pageSize?: string;
}
