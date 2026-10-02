import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccountingPostingService } from '../accounting-posting/accounting-posting.service';
import {
  CreateBankTransactionDto,
  CreateCashBankAccountDto,
  UpdateCashBankAccountDto,
} from './cash-bank.dto';

@Injectable()
export class CashBankService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly posting: AccountingPostingService,
  ) {}

  async createAccount(data: CreateCashBankAccountDto) {
    await this.assertCashAccount(data.accountId);
    return this.prisma.cashBankAccount.create({
      data: {
        ...data,
        currency: data.currency ?? 'IDR',
        openingBalance: data.openingBalance ?? 0,
      },
      include: { account: true },
    });
  }

  async findAccounts() {
    const accounts = await this.prisma.cashBankAccount.findMany({
      orderBy: { name: 'asc' },
      include: { account: true },
    });
    const totals = await this.prisma.journalLine.groupBy({
      by: ['accountId'],
      where: {
        accountId: { in: accounts.map((cashAccount) => cashAccount.accountId) },
        journal: { status: 'POSTED' },
      },
      _sum: { debit: true, credit: true },
    });
    const totalsByAccount = new Map(
      totals.map((row) => [row.accountId, row._sum]),
    );
    return accounts.map((cashAccount) => {
      const accountTotals = totalsByAccount.get(cashAccount.accountId);
      return {
        ...cashAccount,
        balance:
          Number(cashAccount.openingBalance) +
          Number(accountTotals?.debit ?? 0) -
          Number(accountTotals?.credit ?? 0),
      };
    });
  }

  findAccount(id: number) {
    return this.prisma.cashBankAccount.findUniqueOrThrow({
      where: { id },
      include: { account: true, transactions: { orderBy: { date: 'desc' } } },
    });
  }

  async updateAccount(id: number, data: UpdateCashBankAccountDto) {
    if (data.accountId !== undefined)
      await this.assertCashAccount(data.accountId);
    return this.prisma.cashBankAccount.update({
      where: { id },
      data,
      include: { account: true },
    });
  }

  findTransactions(cashBankAccountId?: number) {
    return this.prisma.bankTransaction.findMany({
      where: { cashBankAccountId },
      orderBy: [{ date: 'desc' }, { id: 'desc' }],
      include: { cashBankAccount: true, journal: true },
    });
  }

  async createTransaction(data: CreateBankTransactionDto, userId: number) {
    return this.prisma.$transaction(async (tx) => {
      const cashAccount = await tx.cashBankAccount.findUnique({
        where: { id: data.cashBankAccountId },
        include: { account: true },
      });
      if (!cashAccount || !cashAccount.isActive) {
        throw new NotFoundException('Active cash/bank account not found');
      }
      if (cashAccount.accountId === data.offsetAccountId) {
        throw new BadRequestException(
          'Offset account must differ from cash/bank account',
        );
      }
      const transaction = await tx.bankTransaction.create({
        data: {
          cashBankAccountId: data.cashBankAccountId,
          date: new Date(data.date),
          description: data.description,
          type: data.type,
          amount: data.amount,
          offsetAccountId: data.offsetAccountId,
          createdById: userId,
        },
      });
      const lines =
        data.type === 'IN'
          ? [
              {
                accountId: cashAccount.accountId,
                debit: data.amount,
                credit: 0,
              },
              {
                accountId: data.offsetAccountId,
                debit: 0,
                credit: data.amount,
              },
            ]
          : [
              {
                accountId: data.offsetAccountId,
                debit: data.amount,
                credit: 0,
              },
              {
                accountId: cashAccount.accountId,
                debit: 0,
                credit: data.amount,
              },
            ];
      const journal = await this.posting.createPostedJournal(tx, {
        number: data.journalNumber,
        date: new Date(data.date),
        description: data.description,
        periodId: data.periodId,
        source: 'BANK_TRANSACTION',
        sourceId: transaction.id,
        createdById: userId,
        lines,
      });
      return tx.bankTransaction.update({
        where: { id: transaction.id },
        data: { journalId: journal.id },
        include: {
          cashBankAccount: true,
          journal: { include: { lines: true } },
        },
      });
    });
  }

  async reconcileTransaction(id: number, reconciled: boolean) {
    const transaction = await this.prisma.bankTransaction.findUnique({
      where: { id },
    });
    if (!transaction)
      throw new NotFoundException(`Bank transaction ${id} not found`);
    if (!transaction.journalId) {
      throw new BadRequestException(
        'Only posted bank transactions can be reconciled',
      );
    }
    return this.prisma.bankTransaction.update({
      where: { id },
      data: { reconciled, reconciledAt: reconciled ? new Date() : null },
    });
  }

  private async assertCashAccount(accountId: number) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });
    if (!account)
      throw new BadRequestException('Backing GL account does not exist');
    if (account.type !== 'ASSET' || !account.isActive || !account.isPostable) {
      throw new BadRequestException(
        'Cash/bank accounts must use an active postable asset account',
      );
    }
  }
}
