import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  ParseEnumPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { TaskStatus, TaskPriority } from '../prisma/client/client';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('api/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create new task' })
  @ApiCreatedResponse({ description: 'Task created' })
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks' })
  @ApiOkResponse({ description: 'List of tasks' })
  findAll(
    @Query('keyword') keyword?: string,
    @Query('userId', new ParseIntPipe({ optional: true })) userId?: number,
    @Query('leadId', new ParseIntPipe({ optional: true })) leadId?: number,
    @Query('opportunityId', new ParseIntPipe({ optional: true }))
    opportunityId?: number,
    @Query('status', new ParseEnumPipe(TaskStatus, { optional: true }))
    status?: TaskStatus,
    @Query('priority', new ParseEnumPipe(TaskPriority, { optional: true }))
    priority?: TaskPriority,
    @Query('isPaginated') isPaginated?: boolean,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.tasksService.findAll({
      keyword,
      userId,
      leadId,
      opportunityId,
      status,
      priority,
      isPaginated: isPaginated === true,
      page,
      limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  @ApiOkResponse({ description: 'Task details' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update task' })
  @ApiOkResponse({ description: 'Task updated' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.tasksService.update(id, updateTaskDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete task (soft delete)' })
  @ApiOkResponse({ description: 'Task deleted' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tasksService.remove(id);
  }
}
