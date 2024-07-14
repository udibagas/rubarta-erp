import { Module } from '@nestjs/common';
import { PaymentAuthorizationsService } from './payment-authorizations.service';
import { PaymentAuthorizationsController } from './payment-authorizations.controller';

@Module({
  controllers: [PaymentAuthorizationsController],
  providers: [PaymentAuthorizationsService],
})
export class PaymentAuthorizationsModule {}
