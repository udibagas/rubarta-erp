import { Controller, Get } from '@nestjs/common';
import { ReportService } from './report.service';
import { Auth } from 'src/auth/auth.decorator';
import { User } from '@prisma/client';

@Controller('api/report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('summary')
  summary(@Auth() user: User) {
    return this.reportService.summary(user.id);
  }
}
