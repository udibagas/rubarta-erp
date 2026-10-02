import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccountingReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async trialBalance(periodId: number) {
    const period = await this.prisma.fiscalPeriod.findUniqueOrThrow({
      where: { id: periodId },
    });
    const accounts = await this.prisma.account.findMany({
      orderBy: { code: 'asc' },
    });
    const sums = await this.prisma.journalLine.groupBy({
      by: ['accountId'],
      where: {
        journal: {
          status: 'POSTED',
          date: { lte: period.endDate },
        },
      },
      _sum: { debit: true, credit: true },
    });
    const activity = await this.prisma.journalLine.groupBy({
      by: ['accountId'],
      where: {
        journal: {
          status: 'POSTED',
          date: { gte: period.startDate, lte: period.endDate },
        },
      },
      _sum: { debit: true, credit: true },
    });
    const byAccount = new Map(sums.map((row) => [row.accountId, row._sum]));
    const activityByAccount = new Map(
      activity.map((row) => [row.accountId, row._sum]),
    );
    const rows = accounts.map((account) => {
      const totals = byAccount.get(account.id);
      const debit = Number(totals?.debit ?? 0);
      const credit = Number(totals?.credit ?? 0);
      const periodTotals = activityByAccount.get(account.id);
      const periodDebit = Number(periodTotals?.debit ?? 0);
      const periodCredit = Number(periodTotals?.credit ?? 0);
      return {
        accountId: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        debit: Math.max(debit - credit, 0),
        credit: Math.max(credit - debit, 0),
        debitTotal: debit,
        creditTotal: credit,
        periodDebit,
        periodCredit,
      };
    });
    const totalDebit = rows.reduce((sum, row) => sum + row.debit, 0);
    const totalCredit = rows.reduce((sum, row) => sum + row.credit, 0);
    return { period, rows, totalDebit, totalCredit };
  }

  async generalLedger(accountId: number, from: string, to: string) {
    const startDate = new Date(from);
    const endDate = new Date(to);
    if (
      !Number.isFinite(startDate.getTime()) ||
      !Number.isFinite(endDate.getTime())
    ) {
      throw new BadRequestException('from and to must be valid dates');
    }
    if (startDate > endDate)
      throw new BadRequestException('from must be before to');
    const account = await this.prisma.account.findUniqueOrThrow({
      where: { id: accountId },
    });
    const opening = await this.prisma.journalLine.aggregate({
      where: {
        accountId,
        journal: { status: 'POSTED', date: { lt: startDate } },
      },
      _sum: { debit: true, credit: true },
    });
    let runningBalance =
      Number(opening._sum.debit ?? 0) - Number(opening._sum.credit ?? 0);
    const lines = await this.prisma.journalLine.findMany({
      where: {
        accountId,
        journal: { status: 'POSTED', date: { gte: startDate, lte: endDate } },
      },
      orderBy: [
        { journal: { date: 'asc' } },
        { journal: { number: 'asc' } },
        { sortOrder: 'asc' },
      ],
      include: { journal: true },
    });
    const entries = lines.map((line) => {
      const debit = Number(line.debit);
      const credit = Number(line.credit);
      runningBalance += debit - credit;
      return {
        id: line.id,
        date: line.journal.date,
        journalNumber: line.journal.number,
        description: line.description ?? line.journal.description,
        debit,
        credit,
        runningBalance,
      };
    });
    return {
      account,
      from: startDate,
      to: endDate,
      openingBalance:
        Number(opening._sum.debit ?? 0) - Number(opening._sum.credit ?? 0),
      entries,
      closingBalance: runningBalance,
    };
  }

  async incomeStatement(periodId: number) {
    const { period, rows } = await this.trialBalance(periodId);
    const revenue = rows
      .filter((row) => row.type === 'REVENUE')
      .map((row) => ({ ...row, balance: row.periodCredit - row.periodDebit }));
    const expenses = rows
      .filter((row) => row.type === 'EXPENSE')
      .map((row) => ({ ...row, balance: row.periodDebit - row.periodCredit }));
    const totalRevenue = revenue.reduce((sum, row) => sum + row.balance, 0);
    const totalExpenses = expenses.reduce((sum, row) => sum + row.balance, 0);
    return {
      period,
      revenue,
      expenses,
      totalRevenue,
      totalExpenses,
      netIncome: totalRevenue - totalExpenses,
    };
  }

  async balanceSheet(periodId: number) {
    const { period, rows } = await this.trialBalance(periodId);
    const assets = rows.filter((row) => row.type === 'ASSET');
    const liabilities = rows.filter((row) => row.type === 'LIABILITY');
    const equity = rows.filter((row) => row.type === 'EQUITY');
    const unclosedEarnings = rows.reduce((sum, row) => {
      if (row.type === 'REVENUE' || row.type === 'EXPENSE') {
        return sum + row.creditTotal - row.debitTotal;
      }
      return sum;
    }, 0);
    return {
      period,
      assets,
      liabilities,
      equity,
      totalAssets: assets.reduce((sum, row) => sum + row.debit - row.credit, 0),
      totalLiabilities: liabilities.reduce(
        (sum, row) => sum + row.credit - row.debit,
        0,
      ),
      unclosedEarnings,
      totalEquity:
        equity.reduce((sum, row) => sum + row.credit - row.debit, 0) +
        unclosedEarnings,
    };
  }
}
