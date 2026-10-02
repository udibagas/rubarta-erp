import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { AccountingReportsService } from './accounting-reports.service';

@Controller('api/accounting/reports')
export class AccountingReportsController {
  constructor(private readonly service: AccountingReportsService) {}

  @Get('trial-balance')
  trialBalance(@Query('periodId', ParseIntPipe) periodId: number) {
    return this.service.trialBalance(periodId);
  }

  @Get('general-ledger')
  generalLedger(
    @Query('accountId', ParseIntPipe) accountId: number,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.service.generalLedger(accountId, from, to);
  }

  @Get('income-statement')
  incomeStatement(@Query('periodId', ParseIntPipe) periodId: number) {
    return this.service.incomeStatement(periodId);
  }

  @Get('balance-sheet')
  balanceSheet(@Query('periodId', ParseIntPipe) periodId: number) {
    return this.service.balanceSheet(periodId);
  }
}
