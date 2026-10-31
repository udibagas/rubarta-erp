import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InvoiceSubmissionsController } from './invoice-submissions.controller';
import { InvoiceSubmissionsPolicy } from './invoice-submissions.policy';
import { InvoiceSubmissionsService } from './invoice-submissions.service';

@Module({
  imports: [PrismaModule],
  controllers: [InvoiceSubmissionsController],
  providers: [InvoiceSubmissionsService, InvoiceSubmissionsPolicy],
  exports: [InvoiceSubmissionsService],
})
export class InvoiceSubmissionsModule {}
