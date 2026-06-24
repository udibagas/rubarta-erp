import { ApiProperty } from '@nestjs/swagger';

export class DashboardSummaryDto {
  @ApiProperty({ description: 'Total number of active customers' })
  totalCustomers: number;

  @ApiProperty({ description: 'Total number of active leads' })
  totalLeads: number;

  @ApiProperty({ description: 'Total number of open opportunities' })
  totalOpportunities: number;

  @ApiProperty({ description: 'Total value of all opportunities' })
  totalOpportunityValue: number;

  @ApiProperty({ description: 'Total number of quotations' })
  totalQuotations: number;

  @ApiProperty({ description: 'Total number of orders' })
  totalOrders: number;

  @ApiProperty({ description: 'Total revenue from completed orders' })
  totalRevenue: number;

  @ApiProperty({ description: 'Number of pending tasks' })
  pendingTasks: number;

  @ApiProperty({ description: 'Number of overdue tasks' })
  overdueTasks: number;
}

export class LeadStatusBreakdownDto {
  @ApiProperty()
  status: string;

  @ApiProperty()
  count: number;

  @ApiProperty()
  percentage: number;
}

export class OpportunityStageBreakdownDto {
  @ApiProperty()
  stage: string;

  @ApiProperty()
  count: number;

  @ApiProperty()
  totalValue: number;

  @ApiProperty()
  averageValue: number;
}

export class LeadSourceBreakdownDto {
  @ApiProperty()
  source: string;

  @ApiProperty()
  count: number;

  @ApiProperty()
  conversionRate: number;
}

export class SalesPerformanceDto {
  @ApiProperty()
  userId: number;

  @ApiProperty()
  userName: string;

  @ApiProperty()
  totalLeads: number;

  @ApiProperty()
  convertedLeads: number;

  @ApiProperty()
  totalOpportunities: number;

  @ApiProperty()
  wonOpportunities: number;

  @ApiProperty()
  totalQuotations: number;

  @ApiProperty()
  acceptedQuotations: number;

  @ApiProperty()
  totalRevenue: number;
}

export class TopCustomerDto {
  @ApiProperty()
  customerId: number;

  @ApiProperty()
  customerName: string;

  @ApiProperty()
  totalOrders: number;

  @ApiProperty()
  totalRevenue: number;

  @ApiProperty()
  lastOrderDate: Date;
}

export class RecentActivityDto {
  @ApiProperty()
  type: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  customerId: number;

  @ApiProperty()
  customerName: string;

  @ApiProperty()
  userId: number;

  @ApiProperty()
  userName: string;

  @ApiProperty()
  date: Date;
}

export class MonthlyRevenueDto {
  @ApiProperty()
  month: string;

  @ApiProperty()
  year: number;

  @ApiProperty()
  revenue: number;

  @ApiProperty()
  orderCount: number;
}

export class ConversionFunnelDto {
  @ApiProperty()
  totalLeads: number;

  @ApiProperty()
  qualifiedLeads: number;

  @ApiProperty()
  convertedLeads: number;

  @ApiProperty()
  totalOpportunities: number;

  @ApiProperty()
  proposalSent: number;

  @ApiProperty()
  wonOpportunities: number;

  @ApiProperty()
  totalOrders: number;

  @ApiProperty()
  completedOrders: number;

  @ApiProperty({ description: 'Lead to opportunity conversion rate (%)' })
  leadToOpportunityRate: number;

  @ApiProperty({ description: 'Opportunity to order conversion rate (%)' })
  opportunityToOrderRate: number;

  @ApiProperty({ description: 'Overall conversion rate (%)' })
  overallConversionRate: number;
}

export class TaskStatusBreakdownDto {
  @ApiProperty()
  status: string;

  @ApiProperty()
  count: number;

  @ApiProperty()
  percentage: number;
}

export class UpcomingTaskDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  dueDate: Date;

  @ApiProperty()
  priority: string;

  @ApiProperty()
  customerId: number;

  @ApiProperty()
  customerName: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  isOverdue: boolean;
}

export class QuotationStatusBreakdownDto {
  @ApiProperty()
  status: string;

  @ApiProperty()
  count: number;

  @ApiProperty()
  totalValue: number;
}

export class MaterialStockAlertDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  partNumber: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  currentStock: number;

  @ApiProperty()
  minStock: number;

  @ApiProperty()
  stockPercentage: number;

  @ApiProperty()
  supplierName: string;
}
