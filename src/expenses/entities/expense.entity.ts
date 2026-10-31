import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class Expense {
  @ApiProperty()
  id: number;

  @ApiProperty({ type: Date })
  date: Date;

  @ApiProperty()
  description: string;

  @ApiProperty({ type: Number })
  @Type(() => Number)
  amount: number;

  @ApiProperty()
  accountId: number;
}
