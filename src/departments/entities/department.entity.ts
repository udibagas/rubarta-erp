import { ApiProperty } from '@nestjs/swagger';

export class Department {
  @ApiProperty()
  id: number;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;
}
