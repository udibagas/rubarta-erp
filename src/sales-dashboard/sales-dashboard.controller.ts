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

  @Get('revenue-trend')
  @ApiOperation({
    summary: 'Get monthly revenue trend',
    description: 'Returns completed sales revenue grouped by month',
  })
  @ApiQuery({
    name: 'months',
    required: false,
    type: Number,
    description: 'Number of months to include (default: 12)',
  })
  getRevenueTrend(
    @Query('months', new ParseIntPipe({ optional: true })) months?: number,
  ) {
    return this.dashboardService.getRevenueTrend(months);
  }

  @Get('top-products')
  @ApiOperation({
    summary: 'Get top-selling products',
    description:
      'Returns products ranked by completed sales quantity and value',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of products to return (default: 10)',
  })
  getTopProducts(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.dashboardService.getTopProducts(limit);
  }

  @Get('sales-performance')
  @ApiOperation({
    summary: 'Get sales performance',
    description: 'Returns completed sales order performance grouped by user',
  })
  getSalesPerformance() {
    return this.dashboardService.getSalesPerformance();
  }

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
