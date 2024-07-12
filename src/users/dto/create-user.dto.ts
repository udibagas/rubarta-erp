import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsEmail, IsNotEmpty, IsOptional, Length } from 'class-validator';

export class CreateUserDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiProperty()
  @IsEmail({}, { message: 'Invalid email' })
  email: string;

  @ApiProperty()
  @IsOptional()
  role: Role;

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

  // @ApiProperty()
  // @IsOptional()
  // departmentId: string;
}
