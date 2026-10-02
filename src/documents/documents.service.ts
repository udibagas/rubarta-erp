import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const LIMIT_PER_TYPE = 10;

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async search(keyword: string) {
    const q = keyword?.trim();
    if (!q) return [];

    const args = {
      where: { number: { contains: q, mode: 'insensitive' as const } },
      select: { id: true, number: true, date: true },
      orderBy: { id: 'desc' as const },
      take: LIMIT_PER_TYPE,
    };

    const [
      nkp,
      quotation,
      salesOrder,
      invoice,
      purchaseOrder,
      deliveryOrder,
      goodsReceipt,
    ] = await Promise.all([
      this.prisma.nkp.findMany(args),
      this.prisma.quotation.findMany(args),
      this.prisma.salesOrder.findMany(args),
      this.prisma.invoice.findMany(args),
      this.prisma.purchaseOrder.findMany(args),
      this.prisma.deliveryOrder.findMany(args),
      this.prisma.goodsReceipt.findMany(args),
    ]);

    const tag = <T>(type: string, rows: T[]) =>
      rows.map((row) => ({ type, ...row }));

    return [
      ...tag('nkp', nkp),
      ...tag('quotation', quotation),
      ...tag('sales-order', salesOrder),
      ...tag('invoice', invoice),
      ...tag('purchase-order', purchaseOrder),
      ...tag('delivery-order', deliveryOrder),
      ...tag('goods-receipt', goodsReceipt),
    ];
  }
}
