import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ApprovalModule } from '../approval/approval.module';
import { InvoicesPolicy } from './invoices.policy';

@Module({
  imports: [PrismaModule, ApprovalModule],
  controllers: [InvoicesController],
  providers: [InvoicesService, InvoicesPolicy],
  exports: [InvoicesService],
})
export class InvoicesModule {}
