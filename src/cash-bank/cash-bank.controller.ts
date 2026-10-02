import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Auth } from '../auth/auth.decorator';
import { User } from '../prisma/client/client';
import {
  CreateBankTransactionDto,
  CreateCashBankAccountDto,
  UpdateCashBankAccountDto,
} from './cash-bank.dto';
import { CashBankService } from './cash-bank.service';

@Controller('api/accounting/cash-bank')
export class CashBankController {
  constructor(private readonly service: CashBankService) {}

  @Post('accounts')
  createAccount(@Body() data: CreateCashBankAccountDto, @Auth() _user: User) {
    return this.service.createAccount(data);
  }

  @Get('accounts')
  findAccounts() {
    return this.service.findAccounts();
  }

  @Get('accounts/:id')
  findAccount(@Param('id', ParseIntPipe) id: number) {
    return this.service.findAccount(id);
  }

  @Patch('accounts/:id')
  updateAccount(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateCashBankAccountDto,
    @Auth() _user: User,
  ) {
    return this.service.updateAccount(id, data);
  }

  @Post('transactions')
  createTransaction(
    @Body() data: CreateBankTransactionDto,
    @Auth() user: User,
  ) {
    return this.service.createTransaction(data, user.id);
  }

  @Get('transactions')
  findTransactions(
    @Query('cashBankAccountId', new ParseIntPipe({ optional: true }))
    cashBankAccountId?: number,
  ) {
    return this.service.findTransactions(cashBankAccountId);
  }

  @Post('transactions/:id/reconcile')
  reconcile(@Param('id', ParseIntPipe) id: number, @Auth() _user: User) {
    return this.service.reconcileTransaction(id, true);
  }

  @Post('transactions/:id/unreconcile')
  unreconcile(@Param('id', ParseIntPipe) id: number, @Auth() _user: User) {
    return this.service.reconcileTransaction(id, false);
  }
}
