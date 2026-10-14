import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'admin@mail.com' })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token from the emailed link' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'newSecret123' })
  @IsNotEmpty({ message: 'Password is required' })
  @Length(8, 100, { message: 'Minimum password 8 is characters' })
  password: string;
}
