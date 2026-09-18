import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { DeliveryOrdersService } from './delivery-orders.service';
import { DeliveryOrderType } from './delivery-order.type';
import { Prisma, DeliveryOrderStatus } from '../prisma/client/client';
import { PrismaService } from '../prisma/prisma.service';

@Resolver(() => DeliveryOrderType)
export class DeliveryOrdersResolver {
  constructor(
    private readonly deliveryOrdersService: DeliveryOrdersService,
    private readonly prisma: PrismaService,
  ) {}

  @Query(() => [DeliveryOrderType], {
    name: 'deliveryOrders',
    description: 'Get all delivery orders',
  })
  async findAll(
    @Args('keyword', { nullable: true }) keyword?: string,
    @Args('salesOrderId', { type: () => Int, nullable: true })
    salesOrderId?: number,
    @Args('customerId', { type: () => Int, nullable: true })
    customerId?: number,
    @Args('status', { nullable: true }) status?: DeliveryOrderStatus,
  ) {
    const where: Prisma.DeliveryOrderWhereInput = {};

    if (salesOrderId) where.salesOrderId = salesOrderId;
    if (customerId) where.customerId = customerId;
    if (status) where.status = status;

    return this.prisma.deliveryOrder.findMany({
      where,
      orderBy: { number: 'asc' },
      include: {
        DeliveryOrderItems: true,
      },
    });
  }

  @Query(() => DeliveryOrderType, {
    name: 'deliveryOrder',
    description: 'Get delivery order by ID',
  })
  async findOne(@Args('id', { type: () => Int }) id: number) {
    return this.deliveryOrdersService.findOne(id);
  }
}
