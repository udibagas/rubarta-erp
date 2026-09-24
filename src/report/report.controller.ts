import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { ReportService } from './report.service';
import { Auth } from '../auth/auth.decorator';
import { User } from '../prisma/client/client';

@Controller('api/report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('summary')
  summary(@Auth() user: User) {
    return this.reportService.summary(user.id);
  }

  @Get('customer-monthly-revenue')
  customerMonthlyRevenue(
    @Auth() _user: User,
    @Query('customerId', new ParseIntPipe({ optional: true }))
    customerId?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('dateRange') dateRange?: string | string[],
  ) {
    return this.reportService.customerMonthlyRevenue({
      customerId,
      startDate,
      endDate,
      dateRange,
    });
  }

  @Get('aging-report')
  agingReport(
    @Query('customerId', new ParseIntPipe({ optional: true }))
    customerId?: number,
    @Query('asOfDate') asOfDate?: string,
  ) {
    return this.reportService.agingReport({ customerId, asOfDate });
  }
}
