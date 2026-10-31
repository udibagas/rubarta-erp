import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  ParseEnumPipe,
  Query,
  SerializeOptions,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { ConfirmPaymentDto, CreatePaymentDto } from './dto/create-payment.dto';
import { Auth } from '../auth/auth.decorator';
import {
  AccountingPaymentStatus,
  PaymentDirection,
  User,
} from '../prisma/client/client';
import { Payment } from './entities/payment.entity';

@Controller('api/accounting/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @SerializeOptions({ type: Payment })
  create(@Body() createPaymentDto: CreatePaymentDto, @Auth() user: User) {
    return this.paymentsService.create(createPaymentDto, user.id);
  }

  @Get()
  @SerializeOptions({ type: Payment })
  findAll(
    @Query('direction', new ParseEnumPipe(PaymentDirection, { optional: true }))
    direction?: PaymentDirection,
    @Query(
      'status',
      new ParseEnumPipe(AccountingPaymentStatus, { optional: true }),
    )
    status?: AccountingPaymentStatus,
  ) {
    return this.paymentsService.findAll(direction, status);
  }

  @Get(':id')
  @SerializeOptions({ type: Payment })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.findOne(id);
  }

  @Post(':id/confirm')
  @SerializeOptions({ type: Payment })
  confirm(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: ConfirmPaymentDto,
    @Auth() user: User,
  ) {
    return this.paymentsService.confirm(id, data, user.id);
  }

  @Delete(':id')
  @SerializeOptions({ type: Payment })
  voidDraft(@Param('id', ParseIntPipe) id: number, @Auth() _user: User) {
    return this.paymentsService.voidDraft(id);
  }
}
