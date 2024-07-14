import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

export class User {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ required: false, nullable: true })
  bankAccount: string;

  @ApiProperty()
  active: boolean;

  @ApiProperty({ required: false, nullable: true })
  bankId: number;

  @ApiProperty({ required: false, nullable: true })
  departmentId: number;

  @ApiProperty({ required: false, nullable: true })
  signatureSpeciment: string;

  @ApiProperty()
  roles: string[];
}
