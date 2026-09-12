import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateInvoiceDto, UpdateInvoiceDto } from './invoice.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ApprovalType, InvoiceStatus, Prisma } from '../prisma/client/client';
import { ApprovalService } from '../approval/approval.service';
import { OnEvent } from '@nestjs/event-emitter';
import { generateInvoicePdf } from './invoice-pdf';
import dayjs from 'dayjs';

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly approvalService: ApprovalService,
  ) {}

  async create(data: CreateInvoiceDto & { userId: number }) {
    const { items, ...invoiceData } = data;
    const { attachments, ...invoiceFields } = invoiceData;
    const number = await this.generateNumber();
    const totals = this.calculateTotals(items, invoiceData.discount);
    const createData: Prisma.InvoiceUncheckedCreateInput = {
      ...invoiceFields,
      ...(attachments === undefined
        ? {}
        : { attachments: attachments as Prisma.InputJsonValue }),
      number,
      date: new Date(invoiceData.date),
      dueDate: new Date(invoiceData.dueDate),
      ...totals,
      status: InvoiceStatus.Draft,
      InvoiceItems: {
        create: items.map((i) => ({
          ...i,
          totalPrice: i.quantity * i.unitPrice,
        })),
      },
    };

    return this.prisma.invoice.create({
      data: createData,
      include: {
        Customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
          },
        },
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        SalesOrder: {
          select: {
            id: true,
            number: true,
            date: true,
          },
        },
        DeliveryOrder: { select: { id: true, number: true, date: true } },
        InvoiceItems: true,
      },
    });
  }

  async findAll(params: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    customerId?: number;
    status?: InvoiceStatus;
    startDate?: Date;
    endDate?: Date;
  }) {
    const {
      page = 1,
      pageSize = 10,
      keyword,
      customerId,
      status,
      startDate,
      endDate,
    } = params;

    const where: Prisma.InvoiceWhereInput = {};

    if (customerId) {
      where.customerId = customerId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = startDate;
      }
      if (endDate) {
        where.date.lte = endDate;
      }
    }

    if (keyword) {
      where.OR = [
        {
          number: {
            contains: keyword,
            mode: 'insensitive',
          },
        },
        {
          Customer: {
            name: {
              contains: keyword,
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    const data = await this.prisma.invoice.findMany({
      where,
      take: pageSize,
      skip: (page - 1) * pageSize,
      orderBy: { date: 'desc' },
      include: {
        Customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        User: {
          select: {
            id: true,
            name: true,
          },
        },
        SalesOrder: {
          select: {
            id: true,
            number: true,
          },
        },
        DeliveryOrder: { select: { id: true, number: true } },
        InvoiceItems: true,
        Payments: {
          select: {
            id: true,
            date: true,
            amountPaid: true,
          },
        },
      },
    });

    const total = await this.prisma.invoice.count({ where });

    return {
      data,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: number) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        Customer: true,
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        SalesOrder: {
          include: {
            SalesOrderItems: true,
          },
        },
        DeliveryOrder: true,
        InvoiceItems: true,
        Payments: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return invoice;
  }

  async update(id: number, data: UpdateInvoiceDto) {
    const invoice = await this.findOne(id);

    const { items, ...invoiceData } = data;

    const { attachments, ...invoiceFields } = invoiceData;
    const updateData: Prisma.InvoiceUpdateInput = {
      ...invoiceFields,
      ...(attachments === undefined
        ? {}
        : { attachments: attachments as Prisma.InputJsonValue }),
    };

    if (invoiceData.date) {
      updateData.date = new Date(invoiceData.date);
    }

    if (invoiceData.dueDate) {
      updateData.dueDate = new Date(invoiceData.dueDate);
    }

    if (items) {
      const totals = this.calculateTotals(
        items,
        invoiceData.discount ?? invoice.discount,
      );
      Object.assign(updateData, totals);

      await this.prisma.invoiceItem.deleteMany({
        where: { invoiceId: id },
      });

      updateData.InvoiceItems = {
        create: items.map((item) => ({
          ...item,
          totalPrice: item.quantity * item.unitPrice,
        })),
      };
    } else if (invoiceData.discount !== undefined) {
      Object.assign(
        updateData,
        this.calculateTotals(invoice.InvoiceItems, invoiceData.discount),
      );
    }

    return this.prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        Customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        User: {
          select: {
            id: true,
            name: true,
          },
        },
        SalesOrder: {
          select: {
            id: true,
            number: true,
          },
        },
        DeliveryOrder: { select: { id: true, number: true } },
        InvoiceItems: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Verify invoice exists

    // Delete invoice items first (cascade should handle this, but being explicit)
    await this.prisma.invoiceItem.deleteMany({
      where: { invoiceId: id },
    });

    return this.prisma.invoice.delete({
      where: { id },
    });
  }

  async updateStatus(id: number, status: InvoiceStatus) {
    await this.findOne(id); // Verify invoice exists

    return this.prisma.invoice.update({
      where: { id },
      data: { status },
      include: {
        Customer: {
          select: {
            id: true,
            name: true,
          },
        },
        InvoiceItems: true,
      },
    });
  }

  async submit(id: number) {
    const invoice = await this.findOne(id);

    if (invoice.status !== InvoiceStatus.Draft) {
      return invoice;
    }

    const submittedInvoice = await this.prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.Submitted },
    });

    await this.approvalService.requestApproval(ApprovalType.INVOICE, id);

    return submittedInvoice;
  }

  async preview(id: number): Promise<Buffer> {
    const invoice = await this.findOne(id);
    return generateInvoicePdf(invoice);
  }

  async getTotalAmount(customerId?: number, status?: InvoiceStatus) {
    const where: Prisma.InvoiceWhereInput = {};

    if (customerId) {
      where.customerId = customerId;
    }

    if (status) {
      where.status = status;
    }

    const result = await this.prisma.invoice.aggregate({
      where,
      _sum: {
        grandTotal: true,
      },
      _count: true,
    });

    return {
      totalAmount: result._sum.grandTotal || 0,
      count: result._count,
    };
  }

  private async generateNumber(): Promise<string> {
    const lastQuotation = await this.prisma.invoice.findFirst({
      orderBy: { id: 'desc' },
    });

    const monthYear = dayjs().format('MMYYYY');

    const lastNumber = lastQuotation
      ? parseInt(lastQuotation.number.split('-').pop())
      : 0;

    const newNumber = lastNumber + 1;
    return `INV${monthYear}-${newNumber}`;
  }

  private calculateTotals(
    items: Array<{ quantity: number; unitPrice: number }>,
    discount = 0,
  ) {
    const totalAmount = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const vatAmount = totalAmount * 0.11;

    return {
      totalAmount,
      discount,
      vatAmount,
      grandTotal: totalAmount + vatAmount - discount,
    };
  }

  @OnEvent('approval.completed')
  private async handleApprovalCompleted(payload: {
    approvalType: ApprovalType;
    moduleId: number;
  }) {
    if (payload.approvalType !== ApprovalType.INVOICE) {
      return;
    }

    await this.prisma.invoice.update({
      where: { id: payload.moduleId },
      data: { status: InvoiceStatus.Approved },
    });
  }
}
