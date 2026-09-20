import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { SalesDashboardService } from './sales-dashboard.service';

@ApiTags('Sales Dashboard')
@ApiBearerAuth()
@Controller('api/sales-dashboard')
export class SalesDashboardController {
  constructor(private readonly dashboardService: SalesDashboardService) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Get sales dashboard summary',
    description:
      'Returns pipeline metrics, status breakdowns, and recent quotations, orders, deliveries, invoices, purchase orders, and goods receipts',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of recent documents to return (default: 10)',
  })
  getSummary(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.dashboardService.getSummary(limit);
  }
}
