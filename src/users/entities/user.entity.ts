import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export class User {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  password: string;

  @ApiProperty({ required: false, nullable: true })
  bankAccount: string;

  @ApiProperty()
  role: Role;

  @ApiProperty()
  active: boolean;

  @ApiProperty({ required: false, nullable: true })
  bankId: number;

  @ApiProperty({ required: false, nullable: true })
  departmentId: number;

  @ApiProperty({ required: false, nullable: true })
  signatureSpeciment: string;

  verify(password): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}
