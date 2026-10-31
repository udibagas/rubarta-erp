import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { AccountBalance } from '../accounts/entities/account-balance.entity';
import { JournalEntry } from '../journal-entries/journal-entry.entity';
import { PeriodStatus, User as UserModel } from '../prisma/client/client';

export class FiscalPeriod {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: String, format: 'date' })
  startDate: Date;

  @ApiProperty({ type: String, format: 'date' })
  endDate: Date;

  @ApiProperty({ enum: PeriodStatus })
  status: PeriodStatus;

  @ApiProperty({ nullable: true, type: Date })
  closedAt: Date | null;

  @ApiProperty({ nullable: true, type: Number })
  closedById: number | null;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;

  @ApiPropertyOptional({ type: Object, nullable: true })
  closedBy?: UserModel | null;

  @ApiPropertyOptional({ type: () => [JournalEntry] })
  @Type(() => JournalEntry)
  journalEntries?: JournalEntry[];

  @ApiPropertyOptional({ type: () => [AccountBalance] })
  @Type(() => AccountBalance)
  balances?: AccountBalance[];
}
