import { Module } from '@nestjs/common';
import { ExpenseNotesService } from './expense-notes.service';
import { ExpenseNotesController } from './expense-notes.controller';

@Module({
  controllers: [ExpenseNotesController],
  providers: [ExpenseNotesService],
})
export class ExpenseNotesModule {}
