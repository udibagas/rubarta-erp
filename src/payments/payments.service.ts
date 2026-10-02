import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AccountingPaymentStatus,
  PaymentDirection,
} from '../prisma/client/client';
import { AccountingPostingService } from '../accounting-posting/accounting-posting.service';
import { ConfirmPaymentDto, CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly posting: AccountingPostingService,
  ) {}

  async create(data: CreatePaymentDto, userId: number) {
    this.assertDirection(data);
    const allocations = data.allocations ?? [];
    const allocatedCents = allocations.reduce(
      (total, allocation) => total + Math.round(allocation.amount * 100),
      0,
    );
    if (allocatedCents > Math.round(data.amount * 100)) {
      throw new BadRequestException('Allocations cannot exceed payment amount');
    }
    return this.prisma.$transaction(async (tx) => {
      await this.assertAllocationTargets(tx, data, allocations);
      return tx.payment.create({
        data: {
          number: data.number,
          direction: data.direction,
          date: new Date(data.date),
          method: data.method,
          customerId: data.customerId,
          supplierId: data.supplierId,
          cashBankAccountId: data.cashBankAccountId,
          reference: data.reference,
          currency: data.currency ?? 'IDR',
          amount: data.amount,
          notes: data.notes,
          createdById: userId,
          allocations: {
            create: allocations.map((allocation) => ({
              invoiceId: allocation.invoiceId,
              vendorBillId: allocation.vendorBillId,
              amount: allocation.amount,
            })),
          },
        },
        include: {
          cashBankAccount: true,
          allocations: { include: { invoice: true, vendorBill: true } },
        },
      });
    });
  }

  findAll(direction?: PaymentDirection, status?: AccountingPaymentStatus) {
    return this.prisma.payment.findMany({
      where: { direction, status },
      orderBy: [{ date: 'desc' }, { number: 'desc' }],
      include: {
        customer: true,
        supplier: true,
        cashBankAccount: true,
        allocations: { include: { invoice: true, vendorBill: true } },
        journal: true,
      },
    });
  }

  findOne(id: number) {
    return this.prisma.payment.findUniqueOrThrow({
      where: { id },
      include: {
        customer: true,
        supplier: true,
        cashBankAccount: { include: { account: true } },
        allocations: { include: { invoice: true, vendorBill: true } },
        journal: { include: { lines: { include: { account: true } } } },
      },
    });
  }

  async confirm(id: number, data: ConfirmPaymentDto, userId: number) {
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id },
        include: {
          allocations: true,
          cashBankAccount: { include: { account: true } },
        },
      });
      if (!payment) throw new NotFoundException(`Payment ${id} not found`);
      if (payment.status !== 'DRAFT') {
        throw new BadRequestException('Only draft payments can be confirmed');
      }
      if (!payment.cashBankAccount.isActive) {
        throw new BadRequestException('Cash/bank account is inactive');
      }
      const expectedControlType =
        payment.direction === 'IN' ? 'ASSET' : 'LIABILITY';
      const controlAccount = await tx.account.findUnique({
        where: { id: data.controlAccountId },
      });
      if (!controlAccount || controlAccount.type !== expectedControlType) {
        throw new BadRequestException(
          `Control account must be an ${expectedControlType.toLowerCase()} account`,
        );
      }
      await this.assertOutstanding(tx, payment.direction, payment.allocations);

      const amount = payment.amount;
      const lines =
        payment.direction === 'IN'
          ? [
              {
                accountId: payment.cashBankAccount.accountId,
                debit: amount,
                credit: 0,
              },
              { accountId: data.controlAccountId, debit: 0, credit: amount },
            ]
          : [
              { accountId: data.controlAccountId, debit: amount, credit: 0 },
              {
                accountId: payment.cashBankAccount.accountId,
                debit: 0,
                credit: amount,
              },
            ];
      const journal = await this.posting.createPostedJournal(tx, {
        number: data.journalNumber,
        date: payment.date,
        description: `${payment.direction === 'IN' ? 'Receipt' : 'Payment'} ${payment.number}`,
        periodId: data.periodId,
        source: payment.direction === 'IN' ? 'RECEIPT' : 'PAYMENT',
        sourceId: payment.id,
        createdById: userId,
        lines,
      });
      await this.updateAllocatedBalances(
        tx,
        payment.direction,
        payment.allocations,
      );
      return tx.payment.update({
        where: { id },
        data: { status: 'CONFIRMED', journalId: journal.id },
        include: {
          allocations: { include: { invoice: true, vendorBill: true } },
          journal: { include: { lines: true } },
        },
      });
    });
  }

  async voidDraft(id: number) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException(`Payment ${id} not found`);
    if (payment.status !== 'DRAFT') {
      throw new BadRequestException('Only draft payments can be voided');
    }
    return this.prisma.payment.update({
      where: { id },
      data: { status: 'VOID' },
    });
  }

  private assertDirection(data: CreatePaymentDto) {
    if (data.direction === 'IN' && (!data.customerId || data.supplierId)) {
      throw new BadRequestException(
        'Receipts require a customer and cannot specify a supplier',
      );
    }
    if (data.direction === 'OUT' && (!data.supplierId || data.customerId)) {
      throw new BadRequestException(
        'Payments require a supplier and cannot specify a customer',
      );
    }
    for (const allocation of data.allocations ?? []) {
      const hasInvoice = allocation.invoiceId !== undefined;
      const hasBill = allocation.vendorBillId !== undefined;
      if (hasInvoice === hasBill) {
        throw new BadRequestException(
          'Each allocation must reference exactly one invoice or vendor bill',
        );
      }
      if ((data.direction === 'IN') !== hasInvoice) {
        throw new BadRequestException(
          'Allocation document does not match payment direction',
        );
      }
    }
  }

  private async assertAllocationTargets(
    tx: any,
    payment: CreatePaymentDto,
    allocations: NonNullable<CreatePaymentDto['allocations']>,
  ) {
    for (const allocation of allocations) {
      if (allocation.invoiceId) {
        const invoice = await tx.invoice.findUnique({
          where: { id: allocation.invoiceId },
        });
        if (!invoice || invoice.customerId !== payment.customerId) {
          throw new BadRequestException(
            'Invoice does not belong to the selected customer',
          );
        }
      } else {
        const bill = await tx.vendorBill.findUnique({
          where: { id: allocation.vendorBillId },
        });
        if (!bill || bill.supplierId !== payment.supplierId) {
          throw new BadRequestException(
            'Vendor bill does not belong to the selected supplier',
          );
        }
      }
    }
  }

  private async assertOutstanding(
    tx: any,
    direction: 'IN' | 'OUT',
    allocations: any[],
  ) {
    const amountsByTarget = new Map<number, number>();
    for (const allocation of allocations) {
      const targetId =
        direction === 'OUT' ? allocation.vendorBillId : allocation.invoiceId;
      amountsByTarget.set(
        targetId,
        (amountsByTarget.get(targetId) ?? 0) + Number(allocation.amount),
      );
    }

    for (const [targetId, allocatedAmount] of amountsByTarget) {
      if (direction === 'OUT') {
        const bill = await tx.vendorBill.findUnique({
          where: { id: targetId },
        });
        if (!bill || bill.status === 'VOID') {
          throw new BadRequestException(
            'Vendor bill is unavailable for payment',
          );
        }
        const outstanding = Math.round(
          (Number(bill.total) - Number(bill.paidAmount)) * 100,
        );
        if (Math.round(allocatedAmount * 100) > outstanding) {
          throw new BadRequestException(
            `Allocation exceeds outstanding balance on bill ${bill.number}`,
          );
        }
      } else {
        const invoice = await tx.invoice.findUnique({
          where: { id: targetId },
        });
        if (!invoice || invoice.status === 'Paid') {
          throw new BadRequestException('Invoice is unavailable for payment');
        }
        const settled = await tx.paymentAllocation.aggregate({
          where: {
            invoiceId: invoice.id,
            payment: { status: 'CONFIRMED' },
          },
          _sum: { amount: true },
        });
        const outstanding = Math.round(
          (invoice.grandTotal - Number(settled._sum.amount ?? 0)) * 100,
        );
        if (Math.round(allocatedAmount * 100) > outstanding) {
          throw new BadRequestException(
            `Allocation exceeds outstanding balance on invoice ${invoice.number}`,
          );
        }
      }
    }
  }

  private async updateAllocatedBalances(
    tx: any,
    direction: 'IN' | 'OUT',
    allocations: any[],
  ) {
    const billAmounts = new Map<number, number>();
    const invoiceAmounts = new Map<number, number>();
    for (const allocation of allocations) {
      const target =
        direction === 'OUT' ? allocation.vendorBillId : allocation.invoiceId;
      const amounts = direction === 'OUT' ? billAmounts : invoiceAmounts;
      amounts.set(
        target,
        (amounts.get(target) ?? 0) + Number(allocation.amount),
      );
    }
    for (const [billId, amount] of billAmounts) {
      const bill = await tx.vendorBill.findUniqueOrThrow({
        where: { id: billId },
      });
      const paidAmount = Number(bill.paidAmount) + amount;
      const paidCents = Math.round(paidAmount * 100);
      const totalCents = Math.round(Number(bill.total) * 100);
      await tx.vendorBill.update({
        where: { id: billId },
        data: {
          paidAmount,
          status:
            paidCents >= totalCents
              ? 'PAID'
              : paidCents > 0
                ? 'PARTIAL'
                : bill.dueDate < new Date()
                  ? 'OVERDUE'
                  : 'OPEN',
        },
      });
    }
    for (const [invoiceId, amount] of invoiceAmounts) {
      const invoice = await tx.invoice.findUniqueOrThrow({
        where: { id: invoiceId },
      });
      const settled = await tx.paymentAllocation.aggregate({
        where: { invoiceId, payment: { status: 'CONFIRMED' } },
        _sum: { amount: true },
      });
      if (
        Math.round((Number(settled._sum.amount ?? 0) + amount) * 100) >=
        Math.round(invoice.grandTotal * 100)
      ) {
        await tx.invoice.update({
          where: { id: invoiceId },
          data: { status: 'Paid' },
        });
      }
    }
  }
}
