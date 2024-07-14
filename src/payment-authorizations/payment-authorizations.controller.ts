import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { PaymentAuthorizationsService } from './payment-authorizations.service';
import { CreatePaymentAuthorizationDto } from './dto/create-payment-authorization.dto';
import { UpdatePaymentAuthorizationDto } from './dto/update-payment-authorization.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaymentAuthorization } from './entities/payment-authorization.entity';

@ApiTags('Payment Authorizations')
@ApiBearerAuth()
@Controller('api/payment-authorizations')
export class PaymentAuthorizationsController {
  constructor(
    private readonly paymentAuthorizationsService: PaymentAuthorizationsService,
  ) {}

  @Post()
  create(
    @Body() createPaymentAuthorizationDto: CreatePaymentAuthorizationDto,
    @Request() { user },
  ) {
    return this.paymentAuthorizationsService.create({
      ...createPaymentAuthorizationDto,
      requesterId: user.id,
    });
  }

  @Get()
  findAll() {
    return this.paymentAuthorizationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.paymentAuthorizationsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePaymentAuthorizationDto: UpdatePaymentAuthorizationDto,
  ) {
    return this.paymentAuthorizationsService.update(
      +id,
      updatePaymentAuthorizationDto,
    );
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.paymentAuthorizationsService.remove(+id);
  }

  @Post('approve/:id')
  @HttpCode(HttpStatus.OK)
  approve(
    @Param('id', ParseIntPipe) id: number,
    @Request() { user },
    @Body('note') note: string,
  ) {
    this.paymentAuthorizationsService.approve(id, user, note);
  }

  @Post('reject/:id')
  @HttpCode(HttpStatus.OK)
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Request() { user },
    @Body('note') note: string,
  ) {
    this.paymentAuthorizationsService.reject(id, user, note);
  }

  @Post('verify/:id')
  @HttpCode(HttpStatus.OK)
  verify(@Param('id', ParseIntPipe) id: number, @Request() { user }) {
    this.paymentAuthorizationsService.verify(id, user);
  }

  @Post('pay/:id')
  @HttpCode(HttpStatus.OK)
  pay(@Param('id', ParseIntPipe) id: number, @Request() { user }) {
    this.paymentAuthorizationsService.pay(id, user);
  }
}
