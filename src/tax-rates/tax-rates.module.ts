import { Module } from '@nestjs/common';
import { TaxRatesController } from './tax-rates.controller';
import { TaxRatesService } from './tax-rates.service';
import { TaxRatesPolicy } from './tax-rates.policy';

@Module({
  controllers: [TaxRatesController],
  providers: [TaxRatesService, TaxRatesPolicy],
})
export class TaxRatesModule {}
