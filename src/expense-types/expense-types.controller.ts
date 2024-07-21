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
import { ExpenseTypeDto } from './expense-type.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ExpenseType } from './expense-type.entity';
import { Roles } from '../auth/role.decorator';
import { Role } from '@prisma/client';

@ApiTags('Expense Types')
@ApiBearerAuth()
@Controller('api/expense-types')
export class ExpenseTypesController {
  constructor(private readonly expenseTypesService: ExpenseTypesService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create new expense type' })
  @ApiCreatedResponse({ type: ExpenseType })
  create(@Body() expenseTypeDto: ExpenseTypeDto): Promise<ExpenseType> {
    return this.expenseTypesService.create(expenseTypeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all expense typey' })
  @ApiOkResponse({ type: ExpenseType, isArray: true })
  findAll(): Promise<ExpenseType[]> {
    return this.expenseTypesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single expense type by id' })
  @ApiOkResponse({ type: ExpenseType })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ExpenseType> {
    return this.expenseTypesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update expense type by id' })
  @ApiOkResponse({ type: ExpenseType })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() expenseTypeDto: ExpenseTypeDto,
  ): Promise<ExpenseType> {
    return this.expenseTypesService.update(id, expenseTypeDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete expense type by id' })
  @ApiOkResponse({ type: ExpenseType })
  remove(@Param('id', ParseIntPipe) id: number): Promise<ExpenseType> {
    return this.expenseTypesService.remove(id);
  }
}
