import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SalesOrderStatus } from '../prisma/client/client';

type RecentDocument = {
  type: string;
  id: number;
  number: string;
  status: string;
  date: Date;
  amount: number | null;
};

@Injectable()
export class SalesDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getRevenueTrend(months = 12) {
    const monthCount = Math.min(Math.max(months, 1), 36);
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthCount + 1);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const orders = await this.prisma.salesOrder.findMany({
      where: {
        deletedAt: null,
        status: SalesOrderStatus.Completed,
        date: { gte: startDate },
      },
      select: { date: true, grandTotal: true },
      orderBy: { date: 'asc' },
    });

    const monthlyData = new Map<
      string,
      { year: number; month: number; revenue: number; orderCount: number }
    >();

    for (let index = 0; index < monthCount; index += 1) {
      const date = new Date(startDate);
      date.setMonth(startDate.getMonth() + index);
      const key = this.monthKey(date);
      monthlyData.set(key, {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        revenue: 0,
        orderCount: 0,
      });
    }

    orders.forEach((order) => {
      const key = this.monthKey(order.date);
      const month = monthlyData.get(key);
      if (month) {
        month.revenue += order.grandTotal;
        month.orderCount += 1;
      }
    });

    return Array.from(monthlyData.values()).map((month) => ({
      month: `${month.year}-${String(month.month).padStart(2, '0')}`,
      year: month.year,
      revenue: month.revenue,
      orderCount: month.orderCount,
    }));
  }

  async getTopProducts(limit = 10) {
    const productLimit = Math.min(Math.max(limit, 1), 50);
    const products = await this.prisma.salesOrderItem.groupBy({
      by: ['partNumber'],
      where: {
        SalesOrder: {
          deletedAt: null,
          status: SalesOrderStatus.Completed,
        },
      },
      _sum: { quantity: true, totalPrice: true },
      _count: { id: true },
      orderBy: { _sum: { totalPrice: 'desc' } },
      take: productLimit,
    });

    return products.map((product) => ({
      partNumber: product.partNumber,
      orderLineCount: product._count.id,
      quantity: product._sum.quantity || 0,
      revenue: product._sum.totalPrice || 0,
    }));
  }

  async getSalesPerformance() {
    const users = await this.prisma.user.findMany({
      where: { active: true },
      select: { id: true, name: true },
    });

    return Promise.all(
      users.map(async (user) => {
        const orders = await this.prisma.salesOrder.aggregate({
          where: {
            userId: user.id,
            deletedAt: null,
            status: SalesOrderStatus.Completed,
          },
          _count: { id: true },
          _sum: { grandTotal: true },
        });

        return {
          userId: user.id,
          userName: user.name,
          completedOrders: orders._count.id,
          revenue: orders._sum.grandTotal || 0,
        };
      }),
    );
  }

  async getSummary(limit = 10) {
    const recentLimit = Math.min(Math.max(limit, 1), 50);

    const [
      quotations,
      salesOrders,
      deliveryOrders,
      invoices,
      purchaseOrders,
      goodsReceipts,
      quotationStatuses,
      salesOrderStatuses,
      deliveryOrderStatuses,
      invoiceStatuses,
      purchaseOrderStatuses,
      goodsReceiptStatuses,
      recent,
    ] = await Promise.all([
      this.prisma.quotation.aggregate({
        where: { deletedAt: null },
        _count: { id: true },
        _sum: { grandTotal: true },
      }),
      this.prisma.salesOrder.aggregate({
        where: { deletedAt: null },
        _count: { id: true },
        _sum: { grandTotal: true },
      }),
      this.prisma.deliveryOrder.aggregate({
        _count: { id: true },
      }),
      this.prisma.invoice.aggregate({
        _count: { id: true },
        _sum: { grandTotal: true },
      }),
      this.prisma.purchaseOrder.aggregate({
        where: { deletedAt: null },
        _count: { id: true },
        _sum: { grandTotal: true },
      }),
      this.prisma.goodsReceipt.aggregate({
        where: { deletedAt: null },
        _count: { id: true },
      }),
      this.prisma.quotation.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { id: true },
        _sum: { grandTotal: true },
      }),
      this.prisma.salesOrder.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { id: true },
        _sum: { grandTotal: true },
      }),
      this.prisma.deliveryOrder.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      this.prisma.invoice.groupBy({
        by: ['status'],
        _count: { id: true },
        _sum: { grandTotal: true },
      }),
      this.prisma.purchaseOrder.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { id: true },
        _sum: { grandTotal: true },
      }),
      this.prisma.goodsReceipt.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { id: true },
      }),
      this.getRecentDocuments(recentLimit),
    ]);

    return {
      totals: {
        quotations: this.metric(
          quotations._count.id,
          quotations._sum.grandTotal,
        ),
        salesOrders: this.metric(
          salesOrders._count.id,
          salesOrders._sum.grandTotal,
        ),
        deliveryOrders: this.metric(deliveryOrders._count.id),
        invoices: this.metric(invoices._count.id, invoices._sum.grandTotal),
        purchaseOrders: this.metric(
          purchaseOrders._count.id,
          purchaseOrders._sum.grandTotal,
        ),
        goodsReceipts: this.metric(goodsReceipts._count.id),
      },
      statusBreakdown: {
        quotations: this.statusMetrics(quotationStatuses),
        salesOrders: this.statusMetrics(salesOrderStatuses),
        deliveryOrders: this.statusMetrics(deliveryOrderStatuses),
        invoices: this.statusMetrics(invoiceStatuses),
        purchaseOrders: this.statusMetrics(purchaseOrderStatuses),
        goodsReceipts: this.statusMetrics(goodsReceiptStatuses),
      },
      recent,
    };
  }

  private metric(count: number, amount?: number | null) {
    return { count, amount: amount || 0 };
  }

  private monthKey(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  private statusMetrics(
    rows: Array<{
      status: string;
      _count: { id: number };
      _sum?: { grandTotal: number | null };
    }>,
  ) {
    return rows.map((row) => ({
      status: row.status,
      count: row._count.id,
      amount: row._sum?.grandTotal || 0,
    }));
  }

  private async getRecentDocuments(limit: number): Promise<RecentDocument[]> {
    const [
      quotations,
      salesOrders,
      deliveryOrders,
      invoices,
      purchaseOrders,
      goodsReceipts,
    ] = await Promise.all([
      this.prisma.quotation.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          number: true,
          status: true,
          date: true,
          grandTotal: true,
        },
      }),
      this.prisma.salesOrder.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          number: true,
          status: true,
          date: true,
          grandTotal: true,
        },
      }),
      this.prisma.deliveryOrder.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: { id: true, number: true, status: true, date: true },
      }),
      this.prisma.invoice.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          number: true,
          status: true,
          date: true,
          grandTotal: true,
        },
      }),
      this.prisma.purchaseOrder.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          number: true,
          status: true,
          date: true,
          grandTotal: true,
        },
      }),
      this.prisma.goodsReceipt.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: { id: true, number: true, status: true, date: true },
      }),
    ]);

    return [
      ...quotations.map((item) => this.recent('quotation', item)),
      ...salesOrders.map((item) => this.recent('salesOrder', item)),
      ...deliveryOrders.map((item) => this.recent('deliveryOrder', item)),
      ...invoices.map((item) => this.recent('invoice', item)),
      ...purchaseOrders.map((item) => this.recent('purchaseOrder', item)),
      ...goodsReceipts.map((item) => this.recent('goodsReceipt', item)),
    ]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, limit);
  }

  private recent(itemType: string, item: any): RecentDocument {
    return {
      type: itemType,
      id: item.id,
      number: item.number,
      status: item.status,
      date: item.date,
      amount: item.grandTotal ?? null,
    };
  }
}
