import { Module } from '@nestjs/common';
import { InteractionsService } from './interactions.service';
import { InteractionsController } from './interactions.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { InteractionsPolicy } from './interactions.policy';

@Module({
  imports: [PrismaModule],
  controllers: [InteractionsController],
  providers: [InteractionsService, InteractionsPolicy],
  exports: [InteractionsService],
})
export class InteractionsModule {}
