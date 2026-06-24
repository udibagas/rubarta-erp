import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  MaxLength,
} from 'class-validator';

export class CreateContactDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty({ message: 'Customer is required' })
  customerId: number;

  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(200)
  name: string;

  @ApiProperty({ required: false, example: 'john.doe@example.com' })
  @IsEmail({}, { message: 'Invalid email' })
  @IsOptional()
  @MaxLength(100)
  email?: string;

  @ApiProperty({ example: '+628123456789' })
  @IsNotEmpty({ message: 'Phone number is required' })
  @MaxLength(50)
  phone: string;

  @ApiProperty({ required: false, example: 'Sales Manager' })
  @IsOptional()
  @MaxLength(100)
  position?: string;

  @ApiProperty({ required: false, example: 'Primary contact for sales' })
  @IsOptional()
  notes?: string;

  @ApiProperty({ required: false, example: true, default: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiProperty({ required: false, example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
