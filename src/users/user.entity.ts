import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class User {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Bagas Udi' })
  name: string;

  @ApiProperty({ example: 'bagas@mail.com' })
  email: string;

  @ApiProperty({ required: false, nullable: true, example: '2411191***' })
  bankAccount: string;

  @ApiProperty({ example: true })
  active: boolean;

  @ApiProperty({ required: false, nullable: true, example: 1 })
  bankId: number;

  @ApiProperty({ required: false, nullable: true, example: 1 })
  departmentId: number;

  @ApiProperty({
    required: false,
    nullable: true,
    example: 'path/to/signature.png',
  })
  signatureSpeciment: string;

  @ApiProperty({ example: ['APPROVER', 'VERIFIER'] })
  roles: Role[];
}
