import { ApiProperty } from '@nestjs/swagger';

export class Bank {
  @ApiProperty()
  id: number;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;
}
