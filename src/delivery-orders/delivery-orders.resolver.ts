import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { DeliveryOrdersService } from './delivery-orders.service';
import { DeliveryOrderType } from './delivery-order.type';

@Resolver(() => DeliveryOrderType)
export class DeliveryOrdersResolver {
  constructor(private readonly deliveryOrdersService: DeliveryOrdersService) {}

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
  ) {
    return this.deliveryOrdersService.findAll({
      keyword,
      salesOrderId,
      customerId,
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
