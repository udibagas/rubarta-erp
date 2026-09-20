import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SalesDashboardController } from './sales-dashboard.controller';
import { SalesDashboardService } from './sales-dashboard.service';

@Module({
  imports: [PrismaModule],
  controllers: [SalesDashboardController],
  providers: [SalesDashboardService],
})
export class SalesDashboardModule {}
