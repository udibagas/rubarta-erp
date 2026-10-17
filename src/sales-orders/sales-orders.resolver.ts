import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { SalesOrderType } from './sales-order.type';
import { Prisma, SalesOrderStatus } from '../prisma/client/client';
import { PrismaService } from '../prisma/prisma.service';

@Resolver(() => SalesOrderType)
export class SalesOrdersResolver {
  constructor(private readonly prisma: PrismaService) {}

  @Query(() => [SalesOrderType], {
    name: 'salesOrders',
    description: 'Get all sales orders',
  })
  async findAll(
    @Args('customerId', { type: () => Int, nullable: true })
    customerId?: number,
    @Args('status', { type: () => [SalesOrderStatus], nullable: true })
    status?: SalesOrderStatus[],
    @Args('unProcessed', { type: () => Boolean, nullable: true })
    unProcessed?: boolean,
  ) {
    const where: Prisma.SalesOrderWhereInput = {
      deletedAt: null,
    };

    if (customerId) {
      where.customerId = customerId;
    }

    if (status && status.length > 0) {
      where.status = { in: status };
    }

    const data = await this.prisma.salesOrder.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        Customer: { select: { id: true, name: true } },
        SalesOrderItems: true,
        _count: {
          select: {
            PurchaseOrders: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    if (unProcessed !== undefined) {
      return data.filter((order) =>
        unProcessed
          ? order._count.PurchaseOrders === 0
          : order._count.PurchaseOrders > 0,
      );
    }

    return data;
  }
}
