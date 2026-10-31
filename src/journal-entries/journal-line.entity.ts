import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Account } from '../accounts/entities/account.entity';
import { JournalEntry } from './journal-entry.entity';

export class JournalLine {
  @ApiProperty()
  id: number;

  @ApiProperty()
  journalId: number;

  @ApiProperty()
  accountId: number;

  @ApiProperty({ nullable: true, type: String })
  description: string | null;

  @ApiProperty({ type: Number })
  @Type(() => Number)
  debit: number;

  @ApiProperty({ type: Number })
  @Type(() => Number)
  credit: number;

  @ApiProperty()
  sortOrder: number;

  @ApiPropertyOptional({ type: () => JournalEntry })
  @Type(() => JournalEntry)
  journal?: JournalEntry;

  @ApiPropertyOptional({ type: () => Account })
  @Type(() => Account)
  account?: Account;
}
