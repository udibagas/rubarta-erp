import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class CompanyDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'Code is required' })
  code: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiProperty({ default: false })
  @IsBoolean({ message: 'Is Default must be a boolean' })
  isDefault: boolean;
}
