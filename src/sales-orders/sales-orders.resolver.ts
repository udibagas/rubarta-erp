import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { SalesOrdersService } from './sales-orders.service';
import { SalesOrderType } from './sales-order.type';
import { Prisma, SalesOrderStatus } from '../prisma/client/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

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
    @Args('customerId', { type: () => Int, nullable: true })
    customerId?: number,
    @Args('status', { type: () => [SalesOrderStatus], nullable: true })
    status?: SalesOrderStatus[],
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
    const salesOrder = await this.prisma.salesOrder.findFirst({
      where: { id, deletedAt: null },
      include: {
        SalesOrderItems: {
          orderBy: { sortOrder: 'asc' },
        },
        Customer: {
          select: { id: true, name: true },
        },
        User: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!salesOrder) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return salesOrder;
  }
}
