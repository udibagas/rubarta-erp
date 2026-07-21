import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, InvoiceStatus } from '../prisma/client/client';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateInvoiceDto) {
    const { items, ...invoiceData } = data;

    return this.prisma.invoice.create({
      data: {
        ...invoiceData,
        date: new Date(invoiceData.date),
        dueDate: new Date(invoiceData.dueDate),
        status: invoiceData.status || InvoiceStatus.Draft,
        InvoiceItems: {
          create: items,
        },
      },
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
        Order: {
          select: {
            id: true,
            number: true,
            date: true,
          },
        },
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
        Order: {
          select: {
            id: true,
            number: true,
          },
        },
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
        Order: {
          include: {
            OrderItems: true,
          },
        },
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
    await this.findOne(id); // Verify invoice exists

    const { items, ...invoiceData } = data;

    // Build update data
    const updateData: Prisma.InvoiceUpdateInput = {
      ...invoiceData,
    };

    if (invoiceData.date) {
      updateData.date = new Date(invoiceData.date);
    }

    if (invoiceData.dueDate) {
      updateData.dueDate = new Date(invoiceData.dueDate);
    }

    // If items are provided, update them
    if (items && items.length > 0) {
      // Delete existing items and create new ones
      await this.prisma.invoiceItem.deleteMany({
        where: { invoiceId: id },
      });

      updateData.InvoiceItems = {
        create: items,
      };
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
        Order: {
          select: {
            id: true,
            number: true,
          },
        },
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
}
