import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from '@prisma/client';

export class PaymentAuthorization {
  @ApiProperty()
  id: number;

  @ApiProperty()
  date: Date;

  @ApiProperty()
  number?: string;

  @ApiProperty()
  companyId: number;

  @ApiProperty()
  userId: number;

  @ApiProperty()
  bankId: number;

  @ApiProperty()
  grossAmount: number;

  @ApiProperty()
  deduction: number;

  @ApiProperty()
  netAmount: number;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  cashAdvance?: number;

  @ApiProperty()
  description: string;

  @ApiProperty()
  expenseClaimId?: number;

  @ApiProperty()
  status: PaymentStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  PaymentAuthorizationItem?: PaymentAuthorizationItem[];
}

export class PaymentAuthorizationItem {
  @ApiProperty()
  id: number;

  @ApiProperty()
  userId: number;

  @ApiProperty()
  date: Date;

  @ApiProperty()
  description: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  paymentAuthorizationId: number;
}
