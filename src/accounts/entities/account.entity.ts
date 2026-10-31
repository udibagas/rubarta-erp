import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { AccountType } from '../../prisma/client/client';
import { CashBankAccount } from '../../cash-bank/cash-bank-account.entity';
import { JournalLine } from '../../journal-entries/journal-line.entity';
import { TaxRate } from '../../tax-rates/tax-rate.entity';
import { AccountBalance } from './account-balance.entity';

export class Account {
  @ApiProperty()
  id: number;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: AccountType })
  type: AccountType;

  @ApiProperty({ nullable: true, type: Number })
  parentId: number | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  isSystem: boolean;

  @ApiProperty()
  isPostable: boolean;

  @ApiProperty({ nullable: true, type: String })
  description: string | null;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;

  @ApiPropertyOptional({ type: () => Account, nullable: true })
  @Type(() => Account)
  parent?: Account | null;

  @ApiPropertyOptional({ type: () => [Account] })
  @Type(() => Account)
  children?: Account[];

  @ApiPropertyOptional({ type: () => [JournalLine] })
  @Type(() => JournalLine)
  journalLines?: JournalLine[];

  @ApiPropertyOptional({ type: () => CashBankAccount, nullable: true })
  @Type(() => CashBankAccount)
  cashBankAccount?: CashBankAccount | null;

  @ApiPropertyOptional({ type: () => [TaxRate] })
  @Type(() => TaxRate)
  taxRates?: TaxRate[];

  @ApiPropertyOptional({ type: () => [AccountBalance] })
  @Type(() => AccountBalance)
  balances?: AccountBalance[];
}
