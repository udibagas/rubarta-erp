import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../prisma/client/client';

type PostingTransaction = Prisma.TransactionClient;

export interface PostedJournalInput {
  number: string;
  date: Date;
  description: string;
  periodId: number;
  source:
    | 'MANUAL'
    | 'SALES_INVOICE'
    | 'VENDOR_BILL'
    | 'RECEIPT'
    | 'PAYMENT'
    | 'BANK_TRANSACTION';
  sourceId?: number;
  createdById: number;
  lines: {
    accountId: number;
    debit: number | string | Prisma.Decimal;
    credit: number | string | Prisma.Decimal;
    description?: string;
  }[];
}

@Injectable()
export class AccountingPostingService {
  async createPostedJournal(tx: PostingTransaction, data: PostedJournalInput) {
    await this.assertOpenPeriod(tx, data.periodId, data.date);
    this.assertBalanced(data.lines);
    const accountIds = [...new Set(data.lines.map((line) => line.accountId))];
    const accounts = await tx.account.findMany({
      where: { id: { in: accountIds } },
      select: { id: true, isActive: true, isPostable: true },
    });
    if (accounts.length !== accountIds.length) {
      throw new NotFoundException(
        'One or more journal accounts were not found',
      );
    }
    if (accounts.some((account) => !account.isActive || !account.isPostable)) {
      throw new BadRequestException(
        'Journal lines require active, postable accounts',
      );
    }
    return tx.journalEntry.create({
      data: {
        number: data.number,
        date: data.date,
        description: data.description,
        periodId: data.periodId,
        source: data.source,
        sourceId: data.sourceId,
        status: 'POSTED',
        createdById: data.createdById,
        postedById: data.createdById,
        postedAt: new Date(),
        lines: {
          create: data.lines.map((line, index) => ({
            accountId: line.accountId,
            debit: line.debit,
            credit: line.credit,
            description: line.description,
            sortOrder: index,
          })),
        },
      },
      include: {
        lines: { include: { account: true }, orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async assertOpenPeriod(tx: PostingTransaction, periodId: number, date: Date) {
    const period = await tx.fiscalPeriod.findUnique({
      where: { id: periodId },
    });
    if (!period)
      throw new NotFoundException(`Fiscal period ${periodId} not found`);
    if (period.status !== 'OPEN')
      throw new BadRequestException('Fiscal period is closed');
    if (date < period.startDate || date > period.endDate) {
      throw new BadRequestException(
        'Journal date must fall within its fiscal period',
      );
    }
  }

  private assertBalanced(lines: PostedJournalInput['lines']) {
    if (lines.length < 2)
      throw new BadRequestException('A journal requires at least two lines');
    let debitCents = 0;
    let creditCents = 0;
    for (const line of lines) {
      const debit = Number(line.debit);
      const credit = Number(line.credit);
      if (
        !Number.isFinite(debit) ||
        !Number.isFinite(credit) ||
        debit < 0 ||
        credit < 0
      ) {
        throw new BadRequestException(
          'Journal amounts must be valid non-negative values',
        );
      }
      if (debit > 0 === credit > 0) {
        throw new BadRequestException(
          'Each journal line must have either debit or credit',
        );
      }
      debitCents += Math.round(debit * 100);
      creditCents += Math.round(credit * 100);
    }
    if (debitCents <= 0 || debitCents !== creditCents) {
      throw new BadRequestException(
        'Journal debits and credits must be equal and greater than zero',
      );
    }
  }
}
