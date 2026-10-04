import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DeliveryOrdersController } from './delivery-orders.controller';
import { DeliveryOrdersService } from './delivery-orders.service';
import { DeliveryOrdersResolver } from './delivery-orders.resolver';
import { DeliveryOrdersPolicy } from './delivery-orders.policy';

@Module({
  imports: [PrismaModule],
  controllers: [DeliveryOrdersController],
  providers: [DeliveryOrdersService, DeliveryOrdersResolver, DeliveryOrdersPolicy],
  exports: [DeliveryOrdersService],
})
export class DeliveryOrdersModule {}
