import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CrmDashboardService } from './crm-dashboard.service';

@ApiTags('CRM Dashboard')
@ApiBearerAuth()
@Controller('crm-dashboard')
export class CrmDashboardController {
  constructor(private readonly dashboardService: CrmDashboardService) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Get overall dashboard summary',
    description:
      'Returns key metrics including total customers, leads, opportunities, quotations, orders, revenue, and tasks',
  })
  getDashboardSummary() {
    return this.dashboardService.getDashboardSummary();
  }

  @Get('leads/status-breakdown')
  @ApiOperation({
    summary: 'Get lead status breakdown',
    description: 'Returns count and percentage for each lead status',
  })
  getLeadStatusBreakdown() {
    return this.dashboardService.getLeadStatusBreakdown();
  }

  @Get('opportunities/stage-breakdown')
  @ApiOperation({
    summary: 'Get opportunity stage breakdown',
    description:
      'Returns count, total value, and average value for each opportunity stage',
  })
  getOpportunityStageBreakdown() {
    return this.dashboardService.getOpportunityStageBreakdown();
  }

  @Get('leads/source-breakdown')
  @ApiOperation({
    summary: 'Get lead source breakdown',
    description: 'Returns count and conversion rate for each lead source',
  })
  getLeadSourceBreakdown() {
    return this.dashboardService.getLeadSourceBreakdown();
  }

  @Get('sales-performance')
  @ApiOperation({
    summary: 'Get sales performance by user',
    description:
      'Returns sales metrics for each user including leads, opportunities, quotations, and revenue',
  })
  getSalesPerformance() {
    return this.dashboardService.getSalesPerformance();
  }

  @Get('top-customers')
  @ApiOperation({
    summary: 'Get top customers by revenue',
    description: 'Returns top customers sorted by total revenue',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of customers to return (default: 10)',
  })
  getTopCustomers(@Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    return this.dashboardService.getTopCustomers(parsedLimit);
  }

  @Get('recent-activities')
  @ApiOperation({
    summary: 'Get recent activities',
    description:
      'Returns recent activities across leads, opportunities, quotations, orders, tasks, and interactions',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of activities to return (default: 20)',
  })
  getRecentActivities(@Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    return this.dashboardService.getRecentActivities(parsedLimit);
  }

  @Get('revenue/monthly')
  @ApiOperation({
    summary: 'Get monthly revenue trend',
    description: 'Returns revenue and order count for each month',
  })
  @ApiQuery({
    name: 'months',
    required: false,
    type: Number,
    description: 'Number of months to include (default: 12)',
  })
  getMonthlyRevenue(@Query('months') months?: string) {
    const parsedMonths = months ? parseInt(months, 10) : 12;
    return this.dashboardService.getMonthlyRevenue(parsedMonths);
  }

  @Get('conversion-funnel')
  @ApiOperation({
    summary: 'Get conversion funnel data',
    description:
      'Returns conversion metrics from leads through opportunities to orders',
  })
  getConversionFunnel() {
    return this.dashboardService.getConversionFunnel();
  }

  @Get('tasks/status-breakdown')
  @ApiOperation({
    summary: 'Get task status breakdown',
    description: 'Returns count and percentage for each task status',
  })
  getTaskStatusBreakdown() {
    return this.dashboardService.getTaskStatusBreakdown();
  }

  @Get('tasks/upcoming')
  @ApiOperation({
    summary: 'Get upcoming tasks',
    description: 'Returns tasks due within specified number of days',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Number of days to look ahead (default: 7)',
  })
  getUpcomingTasks(@Query('days') days?: string) {
    const parsedDays = days ? parseInt(days, 10) : 7;
    return this.dashboardService.getUpcomingTasks(parsedDays);
  }

  @Get('quotations/status-breakdown')
  @ApiOperation({
    summary: 'Get quotation status breakdown',
    description: 'Returns count and total value for each quotation status',
  })
  getQuotationStatusBreakdown() {
    return this.dashboardService.getQuotationStatusBreakdown();
  }

  @Get('materials/stock-alerts')
  @ApiOperation({
    summary: 'Get low stock material alerts',
    description:
      'Returns materials where current stock is at or below minimum stock level',
  })
  getMaterialStockAlerts() {
    return this.dashboardService.getMaterialStockAlerts();
  }
}
