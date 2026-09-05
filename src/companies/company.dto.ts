import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

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
}

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {}
