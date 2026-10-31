import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { BankTransaction } from '../cash-bank/bank-transaction.entity';
import { FiscalPeriod } from '../fiscal-periods/fiscal-period.entity';
import { Payment } from '../payments/entities/payment.entity';
import {
  JournalSource,
  JournalStatus,
  User as UserModel,
} from '../prisma/client/client';
import { VendorBill } from '../vendor-bills/vendor-bill.entity';
import { JournalLine } from './journal-line.entity';

export class JournalEntry {
  @ApiProperty()
  id: number;

  @ApiProperty()
  number: string;

  @ApiProperty({ type: String, format: 'date' })
  date: Date;

  @ApiProperty()
  description: string;

  @ApiProperty({ enum: JournalStatus })
  status: JournalStatus;

  @ApiProperty({ enum: JournalSource })
  source: JournalSource;

  @ApiProperty({ nullable: true, type: Number })
  sourceId: number | null;

  @ApiProperty()
  periodId: number;

  @ApiProperty({ nullable: true, type: Number })
  reversalOfId: number | null;

  @ApiProperty()
  createdById: number;

  @ApiProperty({ nullable: true, type: Number })
  postedById: number | null;

  @ApiProperty({ nullable: true, type: Date })
  postedAt: Date | null;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;

  @ApiPropertyOptional({ type: () => FiscalPeriod })
  @Type(() => FiscalPeriod)
  period?: FiscalPeriod;

  @ApiPropertyOptional({ type: () => JournalEntry, nullable: true })
  @Type(() => JournalEntry)
  reversalOf?: JournalEntry | null;

  @ApiPropertyOptional({ type: () => JournalEntry, nullable: true })
  @Type(() => JournalEntry)
  reversedBy?: JournalEntry | null;

  @ApiPropertyOptional({ type: Object })
  createdBy?: UserModel;

  @ApiPropertyOptional({ type: Object, nullable: true })
  postedBy?: UserModel | null;

  @ApiPropertyOptional({ type: () => [JournalLine] })
  @Type(() => JournalLine)
  lines?: JournalLine[];

  @ApiPropertyOptional({ type: () => VendorBill, nullable: true })
  @Type(() => VendorBill)
  vendorBill?: VendorBill | null;

  @ApiPropertyOptional({ type: () => Payment, nullable: true })
  @Type(() => Payment)
  payment?: Payment | null;

  @ApiPropertyOptional({ type: () => BankTransaction, nullable: true })
  @Type(() => BankTransaction)
  bankTransaction?: BankTransaction | null;
}
