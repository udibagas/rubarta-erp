import { ApiProperty } from '@nestjs/swagger';

export class ExpenseType {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;
}
