import { Module } from '@nestjs/common';
import { FiscalPeriodsController } from './fiscal-periods.controller';
import { FiscalPeriodsService } from './fiscal-periods.service';
import { FiscalPeriodsPolicy } from './fiscal-periods.policy';

@Module({
  controllers: [FiscalPeriodsController],
  providers: [FiscalPeriodsService, FiscalPeriodsPolicy],
})
export class FiscalPeriodsModule {}
