import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
