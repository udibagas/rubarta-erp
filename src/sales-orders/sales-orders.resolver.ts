import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { SalesOrdersService } from './sales-orders.service';
import { SalesOrderType } from './sales-order.type';
import { Prisma, SalesOrderStatus } from '../prisma/client/client';
import { PrismaService } from '../prisma/prisma.service';

@Resolver(() => SalesOrderType)
export class SalesOrdersResolver {
  constructor(
    private readonly salesOrdersService: SalesOrdersService,
    private readonly prisma: PrismaService,
  ) {}

  @Query(() => [SalesOrderType], {
    name: 'salesOrders',
    description: 'Get all sales orders',
  })
  async findAll(
    @Args('keyword', { nullable: true }) keyword?: string,
    @Args('customerId', { type: () => Int, nullable: true })
    customerId?: number,
    @Args('status', { type: () => SalesOrderStatus, nullable: true })
    status?: SalesOrderStatus,
  ) {
    const where: Prisma.SalesOrderWhereInput = {
      deletedAt: null,
    };

    if (keyword) {
      where.OR = [
        { number: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
        {
          Customer: { name: { contains: keyword, mode: 'insensitive' } },
        },
      ];
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (status) {
      where.status = status;
    }

    return this.prisma.salesOrder.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        Customer: { select: { id: true, name: true } },
        SalesOrderItems: true,
      },
    });
  }

  @Query(() => SalesOrderType, {
    name: 'salesOrder',
    description: 'Get sales order by ID',
  })
  async findOne(@Args('id', { type: () => Int }) id: number) {
    return this.salesOrdersService.findOne(id);
  }
}
