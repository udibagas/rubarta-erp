import { Auth } from './../auth/auth.decorator';
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
import { ExpenseNotesService } from './expense-notes.service';
import { ExpenseNoteDto } from './dto/expense-note.dto';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ExpenseNote } from './entities/expense-note.entity';
import { User } from '@prisma/client';
import { plainToInstance } from 'class-transformer';

@ApiTags('Expense Notes')
@ApiBearerAuth()
@Controller('api/expense-notes')
export class ExpenseNotesController {
  constructor(private readonly expenseNotesService: ExpenseNotesService) {}

  @Post()
  @ApiOperation({ summary: 'Create new expense note' })
  @ApiOkResponse({ type: ExpenseNote, description: 'Created expense note' })
  async create(@Body() expenseNoteDto: ExpenseNoteDto, @Auth() user: User) {
    const data = await this.expenseNotesService.create({
      ...expenseNoteDto,
      userId: user.id,
    });

    return plainToInstance(ExpenseNote, data);
  }

  @Get()
  @ApiOperation({ summary: 'Get all expense notes' })
  @ApiOkResponse({
    type: ExpenseNote,
    isArray: true,
    description: 'Array of expense notes',
  })
  async findAll(@Auth() user: User) {
    const data = this.expenseNotesService.findAll();
    return plainToInstance(ExpenseNote, data);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single expense note by id' })
  @ApiOkResponse({ type: ExpenseNote, description: 'Expense note' })
  async findOne(@Param('id', ParseIntPipe) id: number, @Auth() user: User) {
    const data = await this.expenseNotesService.findOne(id);
    return plainToInstance(ExpenseNote, data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update expense note by id' })
  @ApiOkResponse({ type: ExpenseNote, description: 'Updated expense note' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() expenseNoteDto: ExpenseNoteDto,
    @Auth() user: User,
  ) {
    const data = await this.expenseNotesService.update(id, {
      ...expenseNoteDto,
      userId: user.id,
    });

    return plainToInstance(ExpenseNote, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete expense note by id' })
  @ApiOkResponse({ type: ExpenseNote, description: 'Deleted expense note' })
  async remove(@Param('id', ParseIntPipe) id: number, @Auth() user: User) {
    const data = await this.expenseNotesService.remove(id);
    return plainToInstance(ExpenseNote, data);
  }
}
