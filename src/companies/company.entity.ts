import { ApiProperty } from '@nestjs/swagger';

export class Company {
  @ApiProperty()
  id: number;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;
}
