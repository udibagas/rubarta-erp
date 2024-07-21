import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class BankDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'Code is required' })
  code: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;
}
