import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JsonObject } from '@prisma/client/runtime/library';
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

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  departmentId?: number;

  @ApiProperty({ description: 'Signature' })
  @IsOptional()
  @IsObject({ message: 'Invalid object' })
  signatureSpeciment?: JsonObject;

  @ApiProperty({ example: ['APPROVER', 'VERIFIER'], enum: Role })
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(Role, { each: true, message: 'Invalid Role' })
  roles: Role[];

  @ApiProperty({ description: 'User status', example: true })
  @IsBoolean({ message: 'Invalid status' })
  @IsOptional()
  active?: boolean;
}
