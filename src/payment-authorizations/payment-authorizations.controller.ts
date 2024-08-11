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
  Query,
} from '@nestjs/common';
import { PaymentAuthorizationsService } from './payment-authorizations.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  CloseNkpDto,
  PaymentAuthorizationDto,
} from './payment-authorization.dto';
import { Auth } from '../auth/auth.decorator';
import { PaymentType, User } from '@prisma/client';

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
    @Auth() user: User,
  ) {
    return this.paymentAuthorizationsService.create({
      ...paymentAuthorizationDto,
      requesterId: user.id,
    });
  }

  @Get()
  @ApiOperation({
    summary: 'Get all payment authorizations (nota kuasa pembayaran)',
  })
  findAll(
    @Query('page', ParseIntPipe) page?: number,
    @Query('pageSize', ParseIntPipe) pageSize?: number,
    @Query('keyword') keyword?: string,
    @Query('companyId', ParseIntPipe) companyId?: number,
    @Query('paymentType') paymentType?: PaymentType,
  ) {
    return this.paymentAuthorizationsService.findAll({
      page,
      pageSize,
      companyId,
      paymentType,
      keyword,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get single payment authorization by id (nota kuasa pembayaran)',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.paymentAuthorizationsService.findOne(id);
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

  @Post('submit/:id')
  @ApiOperation({ summary: 'Submit data' })
  @HttpCode(HttpStatus.OK)
  submit(@Param('id', ParseIntPipe) id: number, @Auth() user: User) {
    return this.paymentAuthorizationsService.submit(id, user.id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete payment authorization by id (nota kuasa pembayaran)',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.paymentAuthorizationsService.remove(id);
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
    @Auth() user: User,
    @Body('note') note: string,
  ) {
    return this.paymentAuthorizationsService.approve(id, user.id, note);
  }

  @Post('close/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Close payment authorization item by id',
  })
  close(
    @Param('id', ParseIntPipe) id: number,
    @Auth() user: User,
    @Body() data: CloseNkpDto,
  ) {
    return this.paymentAuthorizationsService.close(id, data, user);
  }
}
