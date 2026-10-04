import { Module } from '@nestjs/common';
import { AccountingPostingService } from './accounting-posting.service';
import { AccountingPostingPolicy } from './accounting-posting.policy';

@Module({
  providers: [AccountingPostingService, AccountingPostingPolicy],
  exports: [AccountingPostingService],
})
export class AccountingPostingModule {}
