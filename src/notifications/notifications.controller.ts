import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from '../auth/auth.decorator';
import { User } from '@prisma/client';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('api/notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all current user notifications' })
  findAll(@Auth() user: User) {
    return this.notificationsService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single notification by id' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.notificationsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Read notification by id' })
  read(@Param('id', ParseIntPipe) id: number) {
    return this.notificationsService.read(id);
  }

  @Patch()
  @ApiOperation({ summary: 'Read notification by id' })
  readAll(@Auth() user: User) {
    return this.notificationsService.readAll(user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification by id' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.notificationsService.remove(id);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete all notifications' })
  removeAll(@Auth() user: User) {
    return this.notificationsService.removeAll(user.id);
  }
}
