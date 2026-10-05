import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { PurchaseOrderType } from './purchase-order.type';
import { Prisma, PurchaseOrderStatus } from '../prisma/client/client';
import { PrismaService } from '../prisma/prisma.service';

@Resolver(() => PurchaseOrderType)
export class PurchaseOrdersResolver {
  constructor(private readonly prisma: PrismaService) {}

  @Query(() => [PurchaseOrderType], {
    name: 'purchaseOrders',
    description: 'Get all purchase orders',
  })
  async findAll(
    @Args('keyword', { nullable: true }) keyword?: string,
    @Args('supplierId', { type: () => Int, nullable: true })
    supplierId?: number,
    @Args('status', { type: () => [PurchaseOrderStatus], nullable: true })
    status?: PurchaseOrderStatus[],
  ) {
    const where: Prisma.PurchaseOrderWhereInput = { deletedAt: null };
    if (keyword) {
      where.OR = [
        { number: { contains: keyword, mode: 'insensitive' } },
        { title: { contains: keyword, mode: 'insensitive' } },
        { referenceNumber: { contains: keyword, mode: 'insensitive' } },
        {
          Supplier: { name: { contains: keyword, mode: 'insensitive' } },
        },
      ];
    }

    if (supplierId) where.supplierId = supplierId;
    if (status && status.length > 0) where.status = { in: status };

    return this.prisma.purchaseOrder.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        PurchaseOrderItems: true,
        Supplier: { select: { id: true, name: true } },
        User: { select: { id: true, name: true } },
        _count: { select: { PurchaseOrderItems: true } },
      },
    });
  }
}
