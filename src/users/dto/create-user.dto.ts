import { Role } from '@prisma/client';
import { IsEmail, IsNotEmpty, IsOptional, Length } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @IsEmail({}, { message: 'Invalid email' })
  email: string;

  @IsOptional()
  role: Role;

  @IsNotEmpty({ message: 'Password is required' })
  @Length(8, undefined, { message: 'Minimum password 8 is characters' })
  password: string;

  @IsOptional()
  bankAccount: string;
}
