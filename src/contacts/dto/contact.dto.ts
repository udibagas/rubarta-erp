import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsInt,
  IsBoolean,
  MaxLength,
} from 'class-validator';

export class CreateContactDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  readonly customerId: number;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MaxLength(200)
  readonly name: string;

  @ApiProperty({ required: false, example: 'john.doe@example.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  readonly email?: string;

  @ApiProperty({ example: '+628123456789' })
  @IsString()
  @MaxLength(50)
  readonly phone: string;

  @ApiProperty({ required: false, example: 'Sales Manager' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  readonly position?: string;

  @ApiProperty({ required: false, example: 'Primary contact for sales' })
  @IsOptional()
  @IsString()
  readonly notes?: string;

  @ApiProperty({ required: false, example: true, default: false })
  @IsOptional()
  @IsBoolean()
  readonly isPrimary?: boolean;

  @ApiProperty({ required: false, example: true, default: true })
  @IsOptional()
  @IsBoolean()
  readonly isActive?: boolean;
}

export class UpdateContactDto extends PartialType(CreateContactDto) {}

export class QueryContactDto {
  @ApiProperty({ required: false, description: 'Filter by customer ID' })
  @IsOptional()
  @IsInt()
  readonly customerId?: number;

  @ApiProperty({ required: false, description: 'Search by name or email' })
  @IsOptional()
  @IsString()
  readonly keyword?: string;

  @ApiProperty({ required: false, description: 'Filter by active status' })
  @IsOptional()
  @IsBoolean()
  readonly isActive?: boolean;
}
