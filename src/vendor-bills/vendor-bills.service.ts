import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettlementStatus } from '../prisma/client/client';
import { AccountingPostingService } from '../accounting-posting/accounting-posting.service';
import { CreateVendorBillDto, PostVendorBillDto } from './vendor-bills.dto';

@Injectable()
export class VendorBillsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly posting: AccountingPostingService,
  ) {}

  create(data: CreateVendorBillDto, userId: number) {
    const taxAmount = data.taxAmount ?? 0;
    if (
      Math.round((data.subtotal + taxAmount) * 100) !==
      Math.round(data.total * 100)
    ) {
      throw new BadRequestException('total must equal subtotal plus taxAmount');
    }
    if (new Date(data.dueDate) < new Date(data.date)) {
      throw new BadRequestException('dueDate cannot be before date');
    }
    return this.prisma.vendorBill.create({
      data: {
        number: data.number,
        vendorRef: data.vendorRef,
        supplierId: data.supplierId,
        purchaseOrderId: data.purchaseOrderId,
        date: new Date(data.date),
        dueDate: new Date(data.dueDate),
        currency: data.currency ?? 'IDR',
        subtotal: data.subtotal,
        taxAmount,
        total: data.total,
        notes: data.notes,
        createdById: userId,
      },
      include: { supplier: true, purchaseOrder: true },
    });
  }

  findAll(status?: SettlementStatus, supplierId?: number) {
    return this.prisma.vendorBill.findMany({
      where: { status, supplierId },
      orderBy: [{ dueDate: 'asc' }, { number: 'asc' }],
      include: { supplier: true, journal: true },
    });
  }

  findOne(id: number) {
    return this.prisma.vendorBill.findUniqueOrThrow({
      where: { id },
      include: {
        supplier: true,
        purchaseOrder: true,
        journal: { include: { lines: { include: { account: true } } } },
        allocations: { include: { payment: true } },
      },
    });
  }

  async post(id: number, data: PostVendorBillDto, userId: number) {
    return this.prisma.$transaction(async (tx) => {
      const bill = await tx.vendorBill.findUnique({ where: { id } });
      if (!bill) throw new NotFoundException(`Vendor bill ${id} not found`);
      if (bill.journalId)
        throw new BadRequestException('Vendor bill is already posted');
      if (bill.status === 'VOID')
        throw new BadRequestException('Voided bills cannot be posted');
      if (data.expenseAccountId === data.payableAccountId) {
        throw new BadRequestException(
          'Expense and payable accounts must be different',
        );
      }
      if (
        bill.taxAmount.greaterThan(0) &&
        (data.taxAccountId === data.expenseAccountId ||
          data.taxAccountId === data.payableAccountId)
      ) {
        throw new BadRequestException(
          'Expense, tax, and payable accounts must be different',
        );
      }
      if (bill.taxAmount.greaterThan(0) && !data.taxAccountId) {
        throw new BadRequestException(
          'taxAccountId is required when the bill has tax',
        );
      }
      const lines = [
        ...(bill.subtotal.greaterThan(0)
          ? [
              {
                accountId: data.expenseAccountId,
                debit: bill.subtotal,
                credit: 0,
              },
            ]
          : []),
        ...(bill.taxAmount.greaterThan(0)
          ? [
              {
                accountId: data.taxAccountId!,
                debit: bill.taxAmount,
                credit: 0,
              },
            ]
          : []),
        { accountId: data.payableAccountId, debit: 0, credit: bill.total },
      ];
      const journal = await this.posting.createPostedJournal(tx, {
        number: data.journalNumber,
        date: bill.date,
        description: `Vendor bill ${bill.number}`,
        periodId: data.periodId,
        source: 'VENDOR_BILL',
        sourceId: bill.id,
        createdById: userId,
        lines,
      });
      return tx.vendorBill.update({
        where: { id },
        data: { journalId: journal.id },
        include: { supplier: true, journal: { include: { lines: true } } },
      });
    });
  }
}
