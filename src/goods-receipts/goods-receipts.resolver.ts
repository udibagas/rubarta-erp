import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { GoodsReceiptType } from './goods-receipt.type';
import {
  Prisma,
  GoodsReceiptStatus,
  PaymentStatus,
} from '../prisma/client/client';
import { PrismaService } from '../prisma/prisma.service';

@Resolver(() => GoodsReceiptType)
export class GoodsReceiptsResolver {
  constructor(private readonly prisma: PrismaService) {}

  @Query(() => [GoodsReceiptType], {
    name: 'goodsReceipts',
    description: 'Get all goods receipts',
  })
  async findAll(
    @Args('keyword', { nullable: true }) keyword?: string,
    @Args('purchaseOrderId', { type: () => Int, nullable: true })
    purchaseOrderId?: number,
    @Args('salesOrderId', { type: () => Int, nullable: true })
    salesOrderId?: number,
    @Args('supplierId', { type: () => Int, nullable: true })
    supplierId?: number,
    @Args('status', { type: () => [GoodsReceiptStatus], nullable: true })
    status?: GoodsReceiptStatus[],
    @Args('paymentStatus', { type: () => [PaymentStatus], nullable: true })
    paymentStatus?: PaymentStatus[],
  ) {
    const where: Prisma.GoodsReceiptWhereInput = { deletedAt: null };
    if (keyword) {
      where.OR = [
        { number: { contains: keyword, mode: 'insensitive' } },
        { sender: { contains: keyword, mode: 'insensitive' } },
        { recipient: { contains: keyword, mode: 'insensitive' } },
        {
          Supplier: { name: { contains: keyword, mode: 'insensitive' } },
        },
      ];
    }

    if (purchaseOrderId) where.purchaseOrderId = purchaseOrderId;
    if (salesOrderId) where.PurchaseOrder = { salesOrderId };
    if (supplierId) where.supplierId = supplierId;
    if (status) where.status = { in: status };
    if (paymentStatus) where.paymentStatus = { in: paymentStatus };

    return this.prisma.goodsReceipt.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        GoodsReceiptItems: true,
        Supplier: { select: { id: true, name: true } },
        PurchaseOrder: {
          select: {
            id: true,
            number: true,
            referenceNumber: true,
            grandTotal: true,
            title: true,
            salesOrderId: true,
            PurchaseOrderItems: true,
          },
        },
        User: { select: { id: true, name: true } },
      },
    });
  }
}
