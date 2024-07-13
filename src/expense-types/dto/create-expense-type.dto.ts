import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateExpenseTypeDto {
  @ApiProperty()
  @IsNotEmpty()
  name: string;
}
