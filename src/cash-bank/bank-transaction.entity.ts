import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { JournalEntry } from '../journal-entries/journal-entry.entity';
import { PaymentDirection, User as UserModel } from '../prisma/client/client';
import { CashBankAccount } from './cash-bank-account.entity';

export class BankTransaction {
  @ApiProperty()
  id: number;

  @ApiProperty()
  cashBankAccountId: number;

  @ApiProperty({ type: String, format: 'date' })
  date: Date;

  @ApiProperty()
  description: string;

  @ApiProperty({ enum: PaymentDirection })
  type: PaymentDirection;

  @ApiProperty({ type: Number })
  @Type(() => Number)
  amount: number;

  @ApiProperty({ nullable: true, type: Number })
  offsetAccountId: number | null;

  @ApiProperty()
  reconciled: boolean;

  @ApiProperty({ nullable: true, type: Date })
  reconciledAt: Date | null;

  @ApiProperty({ nullable: true, type: Number })
  journalId: number | null;

  @ApiProperty()
  createdById: number;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;

  @ApiPropertyOptional({ type: () => CashBankAccount })
  @Type(() => CashBankAccount)
  cashBankAccount?: CashBankAccount;

  @ApiPropertyOptional({ type: () => JournalEntry, nullable: true })
  @Type(() => JournalEntry)
  journal?: JournalEntry | null;

  @ApiPropertyOptional({ type: Object })
  createdBy?: UserModel;
}
