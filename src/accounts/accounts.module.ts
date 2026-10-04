import { Module } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';
import { AccountsPolicy } from './accounts.policy';

@Module({
  controllers: [AccountsController],
  providers: [AccountsService, AccountsPolicy],
})
export class AccountsModule {}
