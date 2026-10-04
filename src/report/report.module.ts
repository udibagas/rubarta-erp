import { Module } from '@nestjs/common';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { ReportPolicy } from './report.policy';

@Module({
  controllers: [ReportController],
  providers: [ReportService, ReportPolicy]
})
export class ReportModule {}
