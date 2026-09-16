import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { GoodsReceiptsController } from './goods-receipts.controller';
import { GoodsReceiptsService } from './goods-receipts.service';
import { GoodsReceiptsResolver } from './goods-receipts.resolver';

@Module({
  imports: [PrismaModule],
  controllers: [GoodsReceiptsController],
  providers: [GoodsReceiptsService, GoodsReceiptsResolver],
  exports: [GoodsReceiptsService],
})
export class GoodsReceiptsModule {}
