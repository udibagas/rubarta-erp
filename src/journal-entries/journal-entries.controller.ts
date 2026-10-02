import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Auth } from '../auth/auth.decorator';
import { JournalStatus, User } from '../prisma/client/client';
import {
  CreateJournalEntryDto,
  ReverseJournalEntryDto,
} from './journal-entries.dto';
import { JournalEntriesService } from './journal-entries.service';

@Controller('api/accounting/journals')
export class JournalEntriesController {
  constructor(private readonly service: JournalEntriesService) {}

  @Post()
  create(@Body() data: CreateJournalEntryDto, @Auth() user: User) {
    return this.service.create(data, user.id);
  }

  @Get()
  findAll(
    @Query('periodId', new ParseIntPipe({ optional: true })) periodId?: number,
    @Query('status', new ParseEnumPipe(JournalStatus, { optional: true }))
    status?: JournalStatus,
  ) {
    return this.service.findAll(periodId, status);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  updateDraft(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: CreateJournalEntryDto,
    @Auth() _user: User,
  ) {
    return this.service.updateDraft(id, data);
  }

  @Post(':id/post')
  post(@Param('id', ParseIntPipe) id: number, @Auth() user: User) {
    return this.service.post(id, user.id);
  }

  @Post(':id/reverse')
  reverse(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: ReverseJournalEntryDto,
    @Auth() user: User,
  ) {
    return this.service.reverse(id, data, user.id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Auth() _user: User) {
    return this.service.removeDraft(id);
  }
}
