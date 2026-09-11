import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { SalesOrdersService } from './sales-orders.service';
import { SalesOrderType } from './sales-order.type';
import { SalesOrderStatus } from '../prisma/client/client';

@Resolver(() => SalesOrderType)
export class SalesOrdersResolver {
  constructor(private readonly salesOrdersService: SalesOrdersService) {}

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
    return this.salesOrdersService.findAll({ keyword, customerId, status });
  }

  @Query(() => SalesOrderType, {
    name: 'salesOrder',
    description: 'Get sales order by ID',
  })
  async findOne(@Args('id', { type: () => Int }) id: number) {
    return this.salesOrdersService.findOne(id);
  }
}
