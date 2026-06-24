import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsInt,
  IsBoolean,
  IsArray,
  IsNumber,
  MaxLength,
  IsUrl,
} from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'PT Maju Jaya' })
  @IsString()
  @MaxLength(200)
  readonly name: string;

  @ApiProperty({ example: 'Jl. Sudirman No. 123, Jakarta' })
  @IsString()
  readonly address: string;

  @ApiProperty({ example: '+62812345678' })
  @IsString()
  @MaxLength(50)
  readonly phone: string;

  @ApiProperty({ example: 'contact@majujaya.com' })
  @IsEmail()
  @MaxLength(100)
  readonly email: string;

  @ApiProperty({ required: false, example: 'https://majujaya.com' })
  @IsOptional()
  @IsUrl()
  @MaxLength(200)
  readonly website?: string;

  @ApiProperty({ required: false, example: 'Manufacturing' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  readonly industry?: string;

  @ApiProperty({ required: false, example: 50 })
  @IsOptional()
  @IsInt()
  readonly employeeCount?: number;

  @ApiProperty({ required: false, example: 1000000000 })
  @IsOptional()
  @IsNumber()
  readonly revenue?: number;

  @ApiProperty({
    required: false,
    example: ['vip', 'corporate'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly tags?: string[];

  @ApiProperty({ required: false, example: true, default: true })
  @IsOptional()
  @IsBoolean()
  readonly isActive?: boolean;
}

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {}

export class QueryCustomerDto {
  @ApiProperty({ required: false, description: 'Search by name or email' })
  @IsOptional()
  @IsString()
  readonly keyword?: string;

  @ApiProperty({ required: false, description: 'Filter by industry' })
  @IsOptional()
  @IsString()
  readonly industry?: string;

  @ApiProperty({ required: false, description: 'Filter by active status' })
  @IsOptional()
  @IsBoolean()
  readonly isActive?: boolean;
}
