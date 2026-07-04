import { Module } from '@nestjs/common';
import { VisitPlansService } from './visit-plans.service';
import { VisitPlansController } from './visit-plans.controller';

@Module({
  controllers: [VisitPlansController],
  providers: [VisitPlansService],
})
export class VisitPlansModule {}
