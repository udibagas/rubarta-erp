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
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { PaymentAuthorization } from './entities/payment-authorization.entity';
import { PaymentAuthorizationDto } from './dto/payment-authorization.dto';

@ApiTags('Payment Authorizations')
@ApiBearerAuth()
@Controller('api/payment-authorizations')
export class PaymentAuthorizationsController {
  constructor(
    private readonly paymentAuthorizationsService: PaymentAuthorizationsService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create new payment authorization (nota kuasa pembayaran)',
  })
  @ApiOkResponse({
    description: 'Created payment authorizaton include the items',
    example: {
      id: 1,
      companyId: 1,
      employeeId: 1,
      bankId: 1,
      bankAccount: '2411191***',
      grossAmount: 2000000,
      deduction: 100000,
      netAmount: 1900000,
      amount: 2000000,
      cashAdvance: 0,
      description: 'Cash Advance for Bagas for 3 days',
      expenseClaimId: 0,
      status: 'SUBMITTED',
      items: [
        {
          date: '2024-01-02',
          description: 'BBM Pertalite 10 Liter',
          amount: 100000,
        },
      ],
    },
  })
  create(
    @Body() paymentAuthorizationDto: PaymentAuthorizationDto,
    @Request() { user },
  ) {
    return this.paymentAuthorizationsService.create({
      ...paymentAuthorizationDto,
      requesterId: user.id,
    });
  }

  @Get()
  @ApiOperation({
    summary: 'Gel all payment authorizations (nota kuasa pembayaran)',
  })
  findAll() {
    return this.paymentAuthorizationsService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get single payment authorization by id (nota kuasa pembayaran)',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.paymentAuthorizationsService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update payment authorization by id (nota kuasa pembayaran)',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() paymentAuthorizationDto: PaymentAuthorizationDto,
  ) {
    return this.paymentAuthorizationsService.update(
      id,
      paymentAuthorizationDto,
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete payment authorization by id (nota kuasa pembayaran)',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.paymentAuthorizationsService.remove(+id);
  }

  @Delete(':id/:itemId')
  @ApiOperation({
    summary: 'Delete payment authorization item by id',
  })
  removeItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return this.paymentAuthorizationsService.removeItem(id, itemId);
  }

  @Post('approve/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Approve payment authorization item by id',
  })
  approve(
    @Param('id', ParseIntPipe) id: number,
    @Request() { user },
    @Body('note') note: string,
  ) {
    this.paymentAuthorizationsService.approve(id, user, note);
  }

  @Post('reject/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reject payment authorization item by id',
  })
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Request() { user },
    @Body('note') note: string,
  ) {
    this.paymentAuthorizationsService.reject(id, user, note);
  }

  @Post('verify/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify payment authorization item by id',
  })
  verify(@Param('id', ParseIntPipe) id: number, @Request() { user }) {
    this.paymentAuthorizationsService.verify(id, user);
  }

  @Post('pay/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Proceed payment authorization item by id',
  })
  pay(@Param('id', ParseIntPipe) id: number, @Request() { user }) {
    this.paymentAuthorizationsService.pay(id, user);
  }
}
