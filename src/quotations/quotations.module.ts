import { Module } from '@nestjs/common';
import { QuotationsService } from './quotations.service';
import { QuotationsController } from './quotations.controller';
import { QuotationsResolver } from './quotations.resolver';
import { PrismaModule } from '../prisma/prisma.module';
import { QuotationsPolicy } from './quotations.policy';

@Module({
  imports: [PrismaModule],
  controllers: [QuotationsController],
  providers: [QuotationsService, QuotationsResolver, QuotationsPolicy],
  exports: [QuotationsService],
})
export class QuotationsModule {}
