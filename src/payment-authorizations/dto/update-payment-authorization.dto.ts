import { PartialType } from '@nestjs/swagger';
import { CreatePaymentAuthorizationDto } from './create-payment-authorization.dto';

export class UpdatePaymentAuthorizationDto extends PartialType(CreatePaymentAuthorizationDto) {}
