import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  SerializeOptions,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { Auth } from '../auth/auth.decorator';
import { User } from '../prisma/client/client';
import { Expense } from './entities/expense.entity';

@Controller('api/accounting/expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @SerializeOptions({ type: Expense })
  create(@Body() createExpenseDto: CreateExpenseDto, @Auth() _user: User) {
    return this.expensesService.create(createExpenseDto);
  }

  @Get()
  @SerializeOptions({ type: Expense })
  findAll() {
    return this.expensesService.findAll();
  }

  @Get(':id')
  @SerializeOptions({ type: Expense })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.expensesService.findOne(id);
  }

  @Patch(':id')
  @SerializeOptions({ type: Expense })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateExpenseDto: UpdateExpenseDto,
    @Auth() _user: User,
  ) {
    return this.expensesService.update(id, updateExpenseDto);
  }

  @Delete(':id')
  @SerializeOptions({ type: Expense })
  remove(@Param('id', ParseIntPipe) id: number, @Auth() _user: User) {
    return this.expensesService.remove(id);
  }
}
