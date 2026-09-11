import { Module } from '@nestjs/common';
import { SalesOrdersService } from './sales-orders.service';
import { SalesOrdersController } from './sales-orders.controller';
import { SalesOrdersResolver } from './sales-orders.resolver';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SalesOrdersController],
  providers: [SalesOrdersService, SalesOrdersResolver],
  exports: [SalesOrdersService],
})
export class SalesOrdersModule {}
