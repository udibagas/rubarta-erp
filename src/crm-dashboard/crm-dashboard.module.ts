import { Module } from '@nestjs/common';
import { CrmDashboardService } from './crm-dashboard.service';
import { CrmDashboardController } from './crm-dashboard.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CrmDashboardPolicy } from './crm-dashboard.policy';

@Module({
  imports: [PrismaModule],
  providers: [CrmDashboardService, CrmDashboardPolicy],
  controllers: [CrmDashboardController],
})
export class CrmDashboardModule {}
