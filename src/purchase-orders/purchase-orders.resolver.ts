import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PurchaseOrderType } from './purchase-order.type';
import { PurchaseOrderStatus } from '../prisma/client/client';

@Resolver(() => PurchaseOrderType)
export class PurchaseOrdersResolver {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Query(() => [PurchaseOrderType], {
    name: 'purchaseOrders',
    description: 'Get all purchase orders',
  })
  async findAll(
    @Args('keyword', { nullable: true }) keyword?: string,
    @Args('supplierId', { type: () => Int, nullable: true })
    supplierId?: number,
    @Args('status', { type: () => PurchaseOrderStatus, nullable: true })
    status?: PurchaseOrderStatus,
  ) {
    return this.purchaseOrdersService.findAll({ keyword, supplierId, status });
  }

  @Query(() => PurchaseOrderType, {
    name: 'purchaseOrder',
    description: 'Get purchase order by ID',
  })
  async findOne(@Args('id', { type: () => Int }) id: number) {
    return this.purchaseOrdersService.findOne(id);
  }
}
