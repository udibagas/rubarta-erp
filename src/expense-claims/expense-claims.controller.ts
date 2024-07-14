import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { ExpenseClaimsService } from './expense-claims.service';
import { CreateExpenseClaimDto } from './dto/create-expense-claim.dto';
import { UpdateExpenseClaimDto } from './dto/update-expense-claim.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Expense Claims')
@ApiBearerAuth()
@Controller('api/expense-claims')
export class ExpenseClaimsController {
  constructor(private readonly expenseClaimsService: ExpenseClaimsService) {}

  @Post()
  create(@Body() createExpenseClaimDto: CreateExpenseClaimDto) {
    return this.expenseClaimsService.create(createExpenseClaimDto);
  }

  @Get()
  findAll() {
    return this.expenseClaimsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.expenseClaimsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateExpenseClaimDto: UpdateExpenseClaimDto,
  ) {
    return this.expenseClaimsService.update(id, updateExpenseClaimDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.expenseClaimsService.remove(id);
  }
}
