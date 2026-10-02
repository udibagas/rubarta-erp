import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../prisma/client/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateJournalEntryDto,
  ReverseJournalEntryDto,
} from './journal-entries.dto';

@Injectable()
export class JournalEntriesService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateJournalEntryDto, userId: number) {
    this.assertBalanced(data.lines);
    return this.prisma.$transaction(async (tx) => {
      await this.assertOpenPeriod(tx, data.periodId, new Date(data.date));
      await this.assertPostableAccounts(
        tx,
        data.lines.map((line) => line.accountId),
      );
      return tx.journalEntry.create({
        data: {
          number: data.number,
          date: new Date(data.date),
          description: data.description,
          periodId: data.periodId,
          source: data.source ?? 'MANUAL',
          sourceId: data.sourceId,
          createdById: userId,
          lines: {
            create: data.lines.map((line) => ({
              accountId: line.accountId,
              description: line.description,
              debit: line.debit,
              credit: line.credit,
              sortOrder: line.sortOrder ?? 0,
            })),
          },
        },
        include: {
          lines: { include: { account: true }, orderBy: { sortOrder: 'asc' } },
        },
      });
    });
  }

  findAll(periodId?: number, status?: 'DRAFT' | 'POSTED' | 'VOID') {
    return this.prisma.journalEntry.findMany({
      where: { periodId, status },
      orderBy: [{ date: 'desc' }, { number: 'desc' }],
      include: {
        lines: { include: { account: true }, orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  findOne(id: number) {
    return this.prisma.journalEntry.findUniqueOrThrow({
      where: { id },
      include: {
        period: true,
        lines: { include: { account: true }, orderBy: { sortOrder: 'asc' } },
        reversalOf: true,
        reversedBy: true,
      },
    });
  }

  async updateDraft(id: number, data: CreateJournalEntryDto) {
    this.assertBalanced(data.lines);
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.journalEntry.findUnique({
        where: { id },
        select: { status: true, lines: true },
      });
      if (!current)
        throw new NotFoundException(`Journal entry ${id} not found`);
      if (current.status !== 'DRAFT') {
        throw new BadRequestException(
          'Only draft journal entries can be edited',
        );
      }
      await this.assertOpenPeriod(tx, data.periodId, new Date(data.date));
      await this.assertPostableAccounts(
        tx,
        data.lines.map((line) => line.accountId),
      );
      return tx.journalEntry.update({
        where: { id },
        data: {
          number: data.number,
          date: new Date(data.date),
          description: data.description,
          periodId: data.periodId,
          source: data.source ?? 'MANUAL',
          sourceId: data.sourceId,
          lines: {
            deleteMany: {},
            create: data.lines.map((line) => ({
              accountId: line.accountId,
              description: line.description,
              debit: line.debit,
              credit: line.credit,
              sortOrder: line.sortOrder ?? 0,
            })),
          },
        },
        include: {
          lines: { include: { account: true }, orderBy: { sortOrder: 'asc' } },
        },
      });
    });
  }

  async post(id: number, userId: number) {
    return this.prisma.$transaction(async (tx) => {
      const entry = await tx.journalEntry.findUnique({
        where: { id },
        include: { lines: true },
      });
      if (!entry) throw new NotFoundException(`Journal entry ${id} not found`);
      if (entry.status !== 'DRAFT') {
        throw new BadRequestException(
          'Only draft journal entries can be posted',
        );
      }
      this.assertBalanced(entry.lines);
      await this.assertOpenPeriod(tx, entry.periodId, entry.date);
      await this.assertPostableAccounts(
        tx,
        entry.lines.map((line) => line.accountId),
      );
      const result = await tx.journalEntry.updateMany({
        where: { id, status: 'DRAFT' },
        data: { status: 'POSTED', postedById: userId, postedAt: new Date() },
      });
      if (!result.count)
        throw new BadRequestException('Journal entry was changed');
      return tx.journalEntry.findUniqueOrThrow({
        where: { id },
        include: {
          lines: { include: { account: true }, orderBy: { sortOrder: 'asc' } },
        },
      });
    });
  }

  async reverse(id: number, data: ReverseJournalEntryDto, userId: number) {
    return this.prisma.$transaction(async (tx) => {
      const original = await tx.journalEntry.findUnique({
        where: { id },
        include: { lines: true, reversedBy: true },
      });
      if (!original)
        throw new NotFoundException(`Journal entry ${id} not found`);
      if (original.status !== 'POSTED' || original.reversedBy) {
        throw new BadRequestException(
          'Only unreversed posted entries can be reversed',
        );
      }
      const reversalDate = new Date(data.date);
      await this.assertOpenPeriod(tx, data.periodId, reversalDate);
      const reversal = await tx.journalEntry.create({
        data: {
          number: data.number,
          date: reversalDate,
          description: `Reversal of ${original.number}: ${original.description}`,
          source: 'MANUAL',
          periodId: data.periodId,
          reversalOfId: id,
          createdById: userId,
          postedById: userId,
          postedAt: new Date(),
          status: 'POSTED',
          lines: {
            create: original.lines.map((line) => ({
              accountId: line.accountId,
              description: line.description,
              debit: line.credit,
              credit: line.debit,
              sortOrder: line.sortOrder,
            })),
          },
        },
        include: {
          lines: { include: { account: true }, orderBy: { sortOrder: 'asc' } },
        },
      });
      await tx.journalEntry.update({
        where: { id },
        data: { status: 'VOID' },
      });
      return reversal;
    });
  }

  async removeDraft(id: number) {
    const entry = await this.prisma.journalEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException(`Journal entry ${id} not found`);
    if (entry.status !== 'DRAFT') {
      throw new BadRequestException(
        'Only draft journal entries can be deleted',
      );
    }
    return this.prisma.journalEntry.delete({ where: { id } });
  }

  private assertBalanced(
    lines: {
      debit: number | string | { toString(): string };
      credit: number | string | { toString(): string };
    }[],
  ) {
    let debitCents = 0;
    let creditCents = 0;
    for (const line of lines) {
      const debit = Number(line.debit);
      const credit = Number(line.credit);
      if (!Number.isFinite(debit) || !Number.isFinite(credit)) {
        throw new BadRequestException('Journal amounts must be valid numbers');
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

  private async assertOpenPeriod(
    tx: Prisma.TransactionClient,
    periodId: number,
    date: Date,
  ) {
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

  private async assertPostableAccounts(
    tx: Prisma.TransactionClient,
    accountIds: number[],
  ) {
    const ids = [...new Set(accountIds)];
    const accounts = await tx.account.findMany({
      where: { id: { in: ids } },
      select: { id: true, isActive: true, isPostable: true },
    });
    if (accounts.length !== ids.length) {
      throw new NotFoundException(
        'One or more journal accounts were not found',
      );
    }
    if (accounts.some((account) => !account.isActive || !account.isPostable)) {
      throw new BadRequestException(
        'Journal lines require active, postable accounts',
      );
    }
  }
}
