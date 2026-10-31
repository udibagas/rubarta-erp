import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Account } from '../accounts/entities/account.entity';
import { Payment } from '../payments/entities/payment.entity';
import { CashBankType } from '../prisma/client/client';
import { BankTransaction } from './bank-transaction.entity';

export class CashBankAccount {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: CashBankType })
  type: CashBankType;

  @ApiProperty()
  accountId: number;

  @ApiProperty({ nullable: true, type: String })
  bankName: string | null;

  @ApiProperty({ nullable: true, type: String })
  accountNumber: string | null;

  @ApiProperty({ nullable: true, type: String })
  accountHolder: string | null;

  @ApiProperty()
  currency: string;

  @ApiProperty({ type: Number })
  @Type(() => Number)
  openingBalance: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;

  @ApiPropertyOptional({ type: () => Account })
  @Type(() => Account)
  account?: Account;

  @ApiPropertyOptional({ type: () => [BankTransaction] })
  @Type(() => BankTransaction)
  transactions?: BankTransaction[];

  @ApiPropertyOptional({ type: () => [Payment] })
  @Type(() => Payment)
  payments?: Payment[];
}
