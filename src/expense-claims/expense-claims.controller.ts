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
import { ExpenseClaimDto } from './dto/expense-claim.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Expense Claims')
@ApiBearerAuth()
@Controller('api/expense-claims')
export class ExpenseClaimsController {
  constructor(private readonly expenseClaimsService: ExpenseClaimsService) {}

  @Post()
  create(@Body() expenseClaimDto: ExpenseClaimDto) {
    return this.expenseClaimsService.create(expenseClaimDto);
  }

  @Get()
  findAll() {
    return this.expenseClaimsService.findAll({});
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.expenseClaimsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() expenseClaimDto: ExpenseClaimDto,
  ) {
    return this.expenseClaimsService.update(id, expenseClaimDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.expenseClaimsService.remove(id);
  }

  @Delete(':id/:itemId')
  removeItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return this.expenseClaimsService.removeItem(id, itemId);
  }
}
