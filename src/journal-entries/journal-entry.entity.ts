import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  BankTransaction as BankTransactionModel,
  FiscalPeriod as FiscalPeriodModel,
  JournalEntry as JournalEntryModel,
  JournalSource,
  JournalStatus,
  Payment as PaymentModel,
  User as UserModel,
  VendorBill as VendorBillModel,
} from '../prisma/client/client';

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

  @ApiProperty({ nullable: true })
  sourceId: number | null;

  @ApiProperty()
  periodId: number;

  @ApiProperty({ nullable: true })
  reversalOfId: number | null;

  @ApiProperty()
  createdById: number;

  @ApiProperty({ nullable: true })
  postedById: number | null;

  @ApiProperty({ nullable: true, type: Date })
  postedAt: Date | null;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;

  @ApiPropertyOptional({ type: Object })
  period?: FiscalPeriodModel;

  @ApiPropertyOptional({ type: Object, nullable: true })
  reversalOf?: JournalEntryModel | null;

  @ApiPropertyOptional({ type: Object, nullable: true })
  reversedBy?: JournalEntryModel | null;

  @ApiPropertyOptional({ type: Object })
  createdBy?: UserModel;

  @ApiPropertyOptional({ type: Object, nullable: true })
  postedBy?: UserModel | null;

  @ApiPropertyOptional({ type: [Object] })
  @Type(() => JournalLine)
  lines?: JournalLine[];

  @ApiPropertyOptional({ type: Object, nullable: true })
  vendorBill?: VendorBillModel | null;

  @ApiPropertyOptional({ type: Object, nullable: true })
  payment?: PaymentModel | null;

  @ApiPropertyOptional({ type: Object, nullable: true })
  bankTransaction?: BankTransactionModel | null;
}

class JournalLine {
  @ApiProperty()
  id: number;

  @ApiProperty()
  journalEntryId: number;

  @ApiProperty()
  accountId: number;

  @ApiProperty()
  @Type(() => Number)
  debit: number;

  @ApiProperty()
  @Type(() => Number)
  credit: number;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}
