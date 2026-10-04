import { Module } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';
import { ExpensesPolicy } from './expenses.policy';

@Module({
  controllers: [ExpensesController],
  providers: [ExpensesService, ExpensesPolicy],
})
export class ExpensesModule {}
