import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class ExpenseTypeDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;
}
