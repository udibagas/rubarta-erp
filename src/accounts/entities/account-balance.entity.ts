import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { FiscalPeriod } from '../../fiscal-periods/fiscal-period.entity';
import { Account } from './account.entity';

export class AccountBalance {
  @ApiProperty()
  id: number;

  @ApiProperty()
  accountId: number;

  @ApiProperty()
  periodId: number;

  @ApiProperty({ type: Number })
  @Type(() => Number)
  openingBalance: number;

  @ApiProperty({ type: Number })
  @Type(() => Number)
  debitTotal: number;

  @ApiProperty({ type: Number })
  @Type(() => Number)
  creditTotal: number;

  @ApiProperty({ type: Date })
  updatedAt: Date;

  @ApiPropertyOptional({ type: () => Account })
  @Type(() => Account)
  account?: Account;

  @ApiPropertyOptional({ type: () => FiscalPeriod })
  @Type(() => FiscalPeriod)
  period?: FiscalPeriod;
}
