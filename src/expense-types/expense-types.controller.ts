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
import { ExpenseTypesService } from './expense-types.service';
import { CreateExpenseTypeDto } from './dto/create-expense-type.dto';
import { UpdateExpenseTypeDto } from './dto/update-expense-type.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ExpenseType } from './entities/expense-type.entity';
import { Roles } from 'src/auth/role.decorator';
import { Role } from '@prisma/client';

@ApiTags('Expense Types')
@ApiBearerAuth()
@Controller('api/expense-types')
export class ExpenseTypesController {
  constructor(private readonly expenseTypesService: ExpenseTypesService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiCreatedResponse({ type: ExpenseType })
  create(
    @Body() createExpenseTypeDto: CreateExpenseTypeDto,
  ): Promise<ExpenseType> {
    return this.expenseTypesService.create(createExpenseTypeDto);
  }

  @Get()
  @ApiOkResponse({ type: ExpenseType, isArray: true })
  findAll(): Promise<ExpenseType[]> {
    return this.expenseTypesService.findAll();
  }

  @Get(':id')
  @ApiOkResponse({ type: ExpenseType })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ExpenseType> {
    return this.expenseTypesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOkResponse({ type: ExpenseType })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateExpenseTypeDto: UpdateExpenseTypeDto,
  ): Promise<ExpenseType> {
    return this.expenseTypesService.update(id, updateExpenseTypeDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOkResponse({ type: ExpenseType })
  remove(@Param('id', ParseIntPipe) id: number): Promise<ExpenseType> {
    return this.expenseTypesService.remove(id);
  }
}
