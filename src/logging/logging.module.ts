import { Module } from '@nestjs/common';
import { LogCleanupService } from './log-cleanup.service';
import { LogsController } from './logs.controller';
import { LogsService } from './logs.service';

@Module({
  controllers: [LogsController],
  providers: [LogCleanupService, LogsService],
})
export class LoggingModule {}
