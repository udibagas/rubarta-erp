import { Module } from '@nestjs/common';
import { CrmDashboardService } from './crm-dashboard.service';
import { CrmDashboardController } from './crm-dashboard.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [CrmDashboardService],
  controllers: [CrmDashboardController],
})
export class CrmDashboardModule {}
