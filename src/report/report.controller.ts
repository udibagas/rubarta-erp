import {
  Controller,
  Get,
  ParseIntPipe,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { Response } from 'express';
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

  @Get('purchase-orders')
  purchaseOrdersReport(
    @Query('supplierId', new ParseIntPipe({ optional: true }))
    supplierId?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('dateRange') dateRange?: string | string[],
  ) {
    return this.reportService.purchaseOrdersReport({
      supplierId,
      startDate,
      endDate,
      dateRange,
    });
  }

  @Get('export/aging-report/pdf')
  async exportAgingReportPdf(
    @Res({ passthrough: true }) res: Response,
    @Query('customerId', new ParseIntPipe({ optional: true }))
    customerId?: number,
    @Query('asOfDate') asOfDate?: string,
  ) {
    const buffer = await this.reportService.exportAgingReportToPdf({
      customerId,
      asOfDate,
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="aging-report.pdf"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  @Get('export/aging-report/excel')
  async exportAgingReportExcel(
    @Res({ passthrough: true }) res: Response,
    @Query('customerId', new ParseIntPipe({ optional: true }))
    customerId?: number,
    @Query('asOfDate') asOfDate?: string,
  ) {
    const buffer = await this.reportService.exportAgingReportToExcel({
      customerId,
      asOfDate,
    });

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="aging-report-${new Date().toISOString().split('T')[0]}.xlsx"`,
    });

    return new StreamableFile(buffer);
  }
}
