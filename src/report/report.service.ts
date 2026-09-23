import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(userId: number) {
    const nkpDraft = await this.prisma.nkp.count({
      where: { status: 'DRAFT' },
    });

    const nkpClosed = await this.prisma.nkp.count({
      where: { status: 'CLOSED' },
    });

    const nkpOpen = await this.prisma.nkp.count({
      where: { status: { notIn: ['CLOSED', 'DRAFT'] } },
    });

    const pendingApprovalCount = await this.prisma.nkpApproval.count({
      where: { userId, approvalStatus: null },
    });

    return {
      nkpDraft,
      nkpClosed,
      nkpOpen,
      pendingApprovalCount,
    };
  }

  async customerMonthlyRevenue(params: {
    customerId?: number;
    startDate?: string;
    endDate?: string;
    dateRange?: string | string[];
  }) {
    const normalizedDateRange = Array.isArray(params.dateRange)
      ? params.dateRange
      : params.dateRange
        ? [params.dateRange]
        : [];

    const startDate = params.startDate || normalizedDateRange[0];
    const endDate = params.endDate || normalizedDateRange[1];

    const where: any = {};

    if (params.customerId) {
      where.customerId = params.customerId;
    }

    if (startDate || endDate) {
      where.date = {};

      if (startDate) {
        where.date.gte = dayjs(startDate).startOf('day').toDate();
      }

      if (endDate) {
        where.date.lte = dayjs(endDate).endOf('day').toDate();
      }
    }

    const invoices = await this.prisma.invoice.findMany({
      where,
      select: {
        customerId: true,
        date: true,
        grandTotal: true,
      },
      orderBy: { date: 'asc' },
    });

    const customerIds = [
      ...new Set(invoices.map((invoice) => invoice.customerId)),
    ];
    const customers = customerIds.length
      ? await this.prisma.customer.findMany({
          where: { id: { in: customerIds } },
          select: { id: true, name: true },
        })
      : [];

    const customerMap = new Map(
      customers.map((customer) => [customer.id, customer.name]),
    );

    const grouped = new Map<
      string,
      {
        customerId: number;
        customerName?: string;
        month: string;
        total: number;
      }
    >();

    for (const invoice of invoices) {
      const month = dayjs(invoice.date).format('YYYY-MM');
      const key = `${invoice.customerId}:${month}`;
      const current = grouped.get(key) ?? {
        customerId: invoice.customerId,
        customerName: customerMap.get(invoice.customerId),
        month,
        total: 0,
      };

      current.total += Number(invoice.grandTotal || 0);
      grouped.set(key, current);
    }

    const data = [...grouped.values()].sort((a, b) => {
      if (a.customerId !== b.customerId) return a.customerId - b.customerId;
      return a.month.localeCompare(b.month);
    });

    return {
      data,
      total: data.reduce((sum, row) => sum + row.total, 0),
    };
  }
}
