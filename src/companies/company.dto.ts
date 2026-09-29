import { ApiProperty, PartialType } from '@nestjs/swagger';
import { JsonArray } from '@prisma/client/runtime/client';
import { IsBoolean, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'Code is required' })
  code: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiProperty({ required: false })
  address?: string;

  @ApiProperty({ required: false })
  phone?: string;

  @ApiProperty({ default: false })
  @IsBoolean({ message: 'Is Default must be a boolean' })
  isDefault: boolean;

  @ApiProperty({ example: { files: [] }, type: Object })
  @IsOptional()
  @IsObject({ each: true })
  banks?: JsonArray;
}

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {}
