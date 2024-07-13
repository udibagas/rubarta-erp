import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  Length,
} from 'class-validator';

export class UserRole {
  @IsNotEmpty()
  role: string;
}

export class CreateUserDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiProperty()
  @IsEmail({}, { message: 'Invalid email' })
  email: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Password is required' })
  @Length(8, undefined, { message: 'Minimum password 8 is characters' })
  password: string;

  @ApiProperty({ required: false })
  @IsOptional()
  bankId: number;

  @ApiProperty({ required: false })
  @IsOptional()
  bankAccount: string;

  @ApiProperty()
  @IsArray()
  @IsNotEmpty({ each: true })
  @IsEnum(Role, { each: true })
  roles: Role[];
}
