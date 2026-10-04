import { Module } from '@nestjs/common';
import { AccountingPostingModule } from '../accounting-posting/accounting-posting.module';
import { CashBankController } from './cash-bank.controller';
import { CashBankService } from './cash-bank.service';
import { CashBankPolicy } from './cash-bank.policy';

@Module({
  imports: [AccountingPostingModule],
  controllers: [CashBankController],
  providers: [CashBankService, CashBankPolicy],
})
export class CashBankModule {}
