import { Module } from '@nestjs/common';
import { VisitPlansService } from './visit-plans.service';
import { VisitPlansController } from './visit-plans.controller';
import { VisitPlansPolicy } from './visit-plans.policy';

@Module({
  controllers: [VisitPlansController],
  providers: [VisitPlansService, VisitPlansPolicy],
})
export class VisitPlansModule {}
