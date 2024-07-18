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

@ApiTags('Expense Notes')
@ApiBearerAuth()
@Controller('api/expense-notes')
export class ExpenseNotesController {
  constructor(private readonly expenseNotesService: ExpenseNotesService) {}

  @Post()
  @ApiOperation({ summary: 'Create new expense note' })
  @ApiOkResponse({ type: ExpenseNote, description: 'Created expense note' })
  create(@Body() expenseNoteDto: ExpenseNoteDto): Promise<ExpenseNote> {
    return this.expenseNotesService.create(expenseNoteDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all expense notes' })
  @ApiOkResponse({ type: [ExpenseNote], description: 'Array of expense notes' })
  findAll(): Promise<ExpenseNote[]> {
    return this.expenseNotesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single expense note by id' })
  @ApiOkResponse({ type: ExpenseNote, description: 'Expense note' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ExpenseNote> {
    return this.expenseNotesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update expense note by id' })
  @ApiOkResponse({ type: ExpenseNote, description: 'Updated expense note' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() expenseNoteDto: ExpenseNoteDto,
  ): Promise<ExpenseNote> {
    return this.expenseNotesService.update(id, expenseNoteDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete expense note by id' })
  @ApiOkResponse({ type: ExpenseNote, description: 'Deleted expense note' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<ExpenseNote> {
    return this.expenseNotesService.remove(id);
  }
}
