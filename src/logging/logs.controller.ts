import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/role.decorator';
import { Role } from '../prisma/client/client';
import { QueryLogsDto } from './logs.dto';
import { LogsService } from './logs.service';

@ApiTags('Logs')
@ApiBearerAuth()
@Controller('api/logs')
@Roles(Role.ADMIN)
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  @ApiOperation({ summary: 'List application logs (admin only, newest first)' })
  findAll(@Query() query: QueryLogsDto) {
    return this.logsService.findAll(query);
  }
}
