import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  LeadStatus,
  OpportunityStages,
  OrderStatus,
  QuotationStatus,
  TaskStatus,
} from '../prisma/client/client';
import {
  DashboardSummaryDto,
  LeadStatusBreakdownDto,
  OpportunityStageBreakdownDto,
  LeadSourceBreakdownDto,
  SalesPerformanceDto,
  TopCustomerDto,
  RecentActivityDto,
  MonthlyRevenueDto,
  ConversionFunnelDto,
  TaskStatusBreakdownDto,
  UpcomingTaskDto,
  QuotationStatusBreakdownDto,
  MaterialStockAlertDto,
} from './dto/dashboard-summary.dto';

@Injectable()
export class CrmDashboardService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get overall dashboard summary with key metrics
   */
  async getDashboardSummary(): Promise<DashboardSummaryDto> {
    const [
      totalCustomers,
      totalLeads,
      opportunities,
      totalQuotations,
      orders,
      tasks,
    ] = await Promise.all([
      // Total active customers
      this.prisma.customer.count({
        where: { isActive: true, deletedAt: null },
      }),
      // Total active leads (not converted)
      this.prisma.lead.count({
        where: { deletedAt: null },
      }),
      // Opportunities data
      this.prisma.opportunity.findMany({
        where: {
          deletedAt: null,
          stage: {
            notIn: [
              OpportunityStages.Closed_Won,
              OpportunityStages.Closed_Lost,
            ],
          },
        },
        select: { amount: true },
      }),
      // Total quotations
      this.prisma.quotation.count({
        where: { deletedAt: null },
      }),
      // Orders data
      this.prisma.order.findMany({
        where: { deletedAt: null },
        select: { status: true, grandTotal: true },
      }),
      // Tasks data
      this.prisma.task.findMany({
        where: { deletedAt: null, status: { not: TaskStatus.Completed } },
        select: { dueDate: true },
      }),
    ]);

    const totalOpportunities = opportunities.length;
    const totalOpportunityValue = opportunities.reduce(
      (sum, opp) => sum + opp.amount,
      0,
    );

    const totalOrders = orders.length;
    const totalRevenue = orders
      .filter((order) => order.status === OrderStatus.Completed)
      .reduce((sum, order) => sum + order.grandTotal, 0);

    const now = new Date();
    const pendingTasks = tasks.length;
    const overdueTasks = tasks.filter((task) => task.dueDate < now).length;

    return {
      totalCustomers,
      totalLeads,
      totalOpportunities,
      totalOpportunityValue,
      totalQuotations,
      totalOrders,
      totalRevenue,
      pendingTasks,
      overdueTasks,
    };
  }

  /**
   * Get lead status breakdown with counts and percentages
   */
  async getLeadStatusBreakdown(): Promise<LeadStatusBreakdownDto[]> {
    const leads = await this.prisma.lead.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: { id: true },
    });

    const total = leads.reduce((sum, lead) => sum + lead._count.id, 0);

    return leads.map((lead) => ({
      status: lead.status,
      count: lead._count.id,
      percentage: total > 0 ? (lead._count.id / total) * 100 : 0,
    }));
  }

  /**
   * Get opportunity stage breakdown with values
   */
  async getOpportunityStageBreakdown(): Promise<
    OpportunityStageBreakdownDto[]
  > {
    const opportunities = await this.prisma.opportunity.groupBy({
      by: ['stage'],
      where: { deletedAt: null },
      _count: { id: true },
      _sum: { amount: true },
      _avg: { amount: true },
    });

    return opportunities.map((opp) => ({
      stage: opp.stage,
      count: opp._count.id,
      totalValue: opp._sum.amount || 0,
      averageValue: opp._avg.amount || 0,
    }));
  }

  /**
   * Get lead source breakdown with conversion rates
   */
  async getLeadSourceBreakdown(): Promise<LeadSourceBreakdownDto[]> {
    const leadsBySource = await this.prisma.lead.groupBy({
      by: ['source'],
      where: { deletedAt: null },
      _count: { id: true },
    });

    const convertedBySource = await this.prisma.lead.groupBy({
      by: ['source'],
      where: {
        deletedAt: null,
        status: LeadStatus.Converted,
      },
      _count: { id: true },
    });

    const convertedMap = new Map(
      convertedBySource.map((item) => [item.source, item._count.id]),
    );

    return leadsBySource.map((item) => {
      const converted = convertedMap.get(item.source) || 0;
      return {
        source: item.source,
        count: item._count.id,
        conversionRate:
          item._count.id > 0 ? (converted / item._count.id) * 100 : 0,
      };
    });
  }

  /**
   * Get sales performance by user
   */
  async getSalesPerformance(): Promise<SalesPerformanceDto[]> {
    const users = await this.prisma.user.findMany({
      select: { id: true, name: true },
    });

    const performance = await Promise.all(
      users.map(async (user) => {
        const [
          leads,
          convertedLeads,
          opportunities,
          wonOpportunities,
          quotations,
          acceptedQuotations,
          orders,
        ] = await Promise.all([
          this.prisma.lead.count({
            where: { userId: user.id, deletedAt: null },
          }),
          this.prisma.lead.count({
            where: {
              userId: user.id,
              deletedAt: null,
              status: LeadStatus.Converted,
            },
          }),
          this.prisma.opportunity.count({
            where: { userId: user.id, deletedAt: null },
          }),
          this.prisma.opportunity.count({
            where: {
              userId: user.id,
              deletedAt: null,
              stage: OpportunityStages.Closed_Won,
            },
          }),
          this.prisma.quotation.count({
            where: { userId: user.id, deletedAt: null },
          }),
          this.prisma.quotation.count({
            where: {
              userId: user.id,
              deletedAt: null,
              status: QuotationStatus.Accepted,
            },
          }),
          this.prisma.order.findMany({
            where: {
              deletedAt: null,
              status: OrderStatus.Completed,
              Customer: {
                Opportunities: {
                  some: { userId: user.id },
                },
              },
            },
            select: { grandTotal: true },
          }),
        ]);

        const totalRevenue = orders.reduce(
          (sum, order) => sum + order.grandTotal,
          0,
        );

        return {
          userId: user.id,
          userName: user.name,
          totalLeads: leads,
          convertedLeads,
          totalOpportunities: opportunities,
          wonOpportunities,
          totalQuotations: quotations,
          acceptedQuotations,
          totalRevenue,
        };
      }),
    );

    return performance.sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  /**
   * Get top customers by revenue
   */
  async getTopCustomers(limit = 10): Promise<TopCustomerDto[]> {
    const customers = await this.prisma.customer.findMany({
      where: { deletedAt: null, isActive: true },
      select: {
        id: true,
        name: true,
        Orders: {
          where: {
            deletedAt: null,
            status: OrderStatus.Completed,
          },
          select: {
            grandTotal: true,
            date: true,
          },
        },
      },
    });

    const customerStats = customers
      .map((customer) => {
        const totalOrders = customer.Orders.length;
        const totalRevenue = customer.Orders.reduce(
          (sum, order) => sum + order.grandTotal,
          0,
        );
        const lastOrder = customer.Orders.sort(
          (a, b) => b.date.getTime() - a.date.getTime(),
        )[0];

        return {
          customerId: customer.id,
          customerName: customer.name,
          totalOrders,
          totalRevenue,
          lastOrderDate: lastOrder?.date || null,
        };
      })
      .filter((stat) => stat.totalRevenue > 0)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);

    return customerStats;
  }

  /**
   * Get recent activities (leads, opportunities, quotations, orders, tasks, interactions)
   */
  async getRecentActivities(limit = 20): Promise<RecentActivityDto[]> {
    const [leads, opportunities, quotations, orders, tasks, interactions] =
      await Promise.all([
        this.prisma.lead.findMany({
          where: { deletedAt: null },
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            createdAt: true,
            Customer: { select: { id: true, name: true } },
            User: { select: { id: true, name: true } },
          },
        }),
        this.prisma.opportunity.findMany({
          where: { deletedAt: null },
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            name: true,
            createdAt: true,
            Customer: { select: { id: true, name: true } },
            User: { select: { id: true, name: true } },
          },
        }),
        this.prisma.quotation.findMany({
          where: { deletedAt: null },
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            number: true,
            createdAt: true,
            Customer: { select: { id: true, name: true } },
            User: { select: { id: true, name: true } },
          },
        }),
        this.prisma.order.findMany({
          where: { deletedAt: null },
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            number: true,
            createdAt: true,
            Customer: { select: { id: true, name: true } },
          },
        }),
        this.prisma.task.findMany({
          where: { deletedAt: null },
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            title: true,
            createdAt: true,
            Lead: {
              select: { Customer: { select: { id: true, name: true } } },
            },
            Opportunity: {
              select: { Customer: { select: { id: true, name: true } } },
            },
            User: { select: { id: true, name: true } },
          },
        }),
        this.prisma.interaction.findMany({
          where: { deletedAt: null },
          take: 10,
          orderBy: { date: 'desc' },
          select: {
            type: true,
            subject: true,
            date: true,
            Lead: {
              select: { Customer: { select: { id: true, name: true } } },
            },
            Opportunity: {
              select: { Customer: { select: { id: true, name: true } } },
            },
            User: { select: { id: true, name: true } },
          },
        }),
      ]);

    const activities: RecentActivityDto[] = [];

    leads.forEach((lead) => {
      activities.push({
        type: 'Lead',
        description: `New lead created`,
        customerId: lead.Customer.id,
        customerName: lead.Customer.name,
        userId: lead.User.id,
        userName: lead.User.name,
        date: lead.createdAt,
      });
    });

    opportunities.forEach((opp) => {
      activities.push({
        type: 'Opportunity',
        description: `New opportunity: ${opp.name}`,
        customerId: opp.Customer.id,
        customerName: opp.Customer.name,
        userId: opp.User.id,
        userName: opp.User.name,
        date: opp.createdAt,
      });
    });

    quotations.forEach((quot) => {
      activities.push({
        type: 'Quotation',
        description: `Quotation created: ${quot.number}`,
        customerId: quot.Customer.id,
        customerName: quot.Customer.name,
        userId: quot.User.id,
        userName: quot.User.name,
        date: quot.createdAt,
      });
    });

    orders.forEach((order) => {
      activities.push({
        type: 'Order',
        description: `Order created: ${order.number}`,
        customerId: order.Customer.id,
        customerName: order.Customer.name,
        userId: null,
        userName: null,
        date: order.createdAt,
      });
    });

    tasks.forEach((task) => {
      activities.push({
        type: 'Task',
        description: `Task created: ${task.title}`,
        customerId:
          task.Lead?.Customer?.id || task.Opportunity?.Customer?.id || null,
        customerName:
          task.Lead?.Customer?.name || task.Opportunity?.Customer?.name || null,
        userId: task.User.id,
        userName: task.User.name,
        date: task.createdAt,
      });
    });

    interactions.forEach((interaction) => {
      activities.push({
        type: 'Interaction',
        description: `${interaction.type}: ${interaction.subject || 'No subject'}`,
        customerId:
          interaction.Lead?.Customer?.id ||
          interaction.Opportunity?.Customer?.id ||
          null,
        customerName:
          interaction.Lead?.Customer?.name ||
          interaction.Opportunity?.Customer?.name ||
          null,
        userId: interaction.User.id,
        userName: interaction.User.name,
        date: interaction.date,
      });
    });

    return activities
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, limit);
  }

  /**
   * Get monthly revenue trend
   */
  async getMonthlyRevenue(months = 12): Promise<MonthlyRevenueDto[]> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const orders = await this.prisma.order.findMany({
      where: {
        deletedAt: null,
        status: OrderStatus.Completed,
        date: {
          gte: startDate,
        },
      },
      select: {
        date: true,
        grandTotal: true,
      },
    });

    // Group by month
    const monthlyData = new Map<string, { revenue: number; count: number }>();

    orders.forEach((order) => {
      const monthKey = `${order.date.getFullYear()}-${String(order.date.getMonth() + 1).padStart(2, '0')}`;
      const existing = monthlyData.get(monthKey) || { revenue: 0, count: 0 };
      monthlyData.set(monthKey, {
        revenue: existing.revenue + order.grandTotal,
        count: existing.count + 1,
      });
    });

    // Convert to array and sort
    const result: MonthlyRevenueDto[] = [];
    monthlyData.forEach((value, key) => {
      const [year, month] = key.split('-');
      result.push({
        month: new Date(parseInt(year), parseInt(month) - 1).toLocaleString(
          'default',
          { month: 'long' },
        ),
        year: parseInt(year),
        revenue: value.revenue,
        orderCount: value.count,
      });
    });

    return result.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return (
        new Date(`${a.month} 1`).getMonth() -
        new Date(`${b.month} 1`).getMonth()
      );
    });
  }

  /**
   * Get conversion funnel data
   */
  async getConversionFunnel(): Promise<ConversionFunnelDto> {
    const [
      totalLeads,
      qualifiedLeads,
      convertedLeads,
      totalOpportunities,
      proposalSent,
      wonOpportunities,
      totalOrders,
      completedOrders,
    ] = await Promise.all([
      this.prisma.lead.count({ where: { deletedAt: null } }),
      this.prisma.lead.count({
        where: {
          deletedAt: null,
          status: { in: [LeadStatus.Qualified, LeadStatus.Converted] },
        },
      }),
      this.prisma.lead.count({
        where: { deletedAt: null, status: LeadStatus.Converted },
      }),
      this.prisma.opportunity.count({ where: { deletedAt: null } }),
      this.prisma.opportunity.count({
        where: { deletedAt: null, stage: OpportunityStages.Proposal_Sent },
      }),
      this.prisma.opportunity.count({
        where: { deletedAt: null, stage: OpportunityStages.Closed_Won },
      }),
      this.prisma.order.count({ where: { deletedAt: null } }),
      this.prisma.order.count({
        where: { deletedAt: null, status: OrderStatus.Completed },
      }),
    ]);

    const leadToOpportunityRate =
      totalLeads > 0 ? (totalOpportunities / totalLeads) * 100 : 0;
    const opportunityToOrderRate =
      totalOpportunities > 0 ? (totalOrders / totalOpportunities) * 100 : 0;
    const overallConversionRate =
      totalLeads > 0 ? (completedOrders / totalLeads) * 100 : 0;

    return {
      totalLeads,
      qualifiedLeads,
      convertedLeads,
      totalOpportunities,
      proposalSent,
      wonOpportunities,
      totalOrders,
      completedOrders,
      leadToOpportunityRate,
      opportunityToOrderRate,
      overallConversionRate,
    };
  }

  /**
   * Get task status breakdown
   */
  async getTaskStatusBreakdown(): Promise<TaskStatusBreakdownDto[]> {
    const tasks = await this.prisma.task.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: { id: true },
    });

    const total = tasks.reduce((sum, task) => sum + task._count.id, 0);

    return tasks.map((task) => ({
      status: task.status,
      count: task._count.id,
      percentage: total > 0 ? (task._count.id / total) * 100 : 0,
    }));
  }

  /**
   * Get upcoming tasks
   */
  async getUpcomingTasks(days = 7): Promise<UpcomingTaskDto[]> {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const tasks = await this.prisma.task.findMany({
      where: {
        deletedAt: null,
        status: { not: TaskStatus.Completed },
        dueDate: {
          lte: endDate,
        },
      },
      orderBy: { dueDate: 'asc' },
      select: {
        id: true,
        title: true,
        dueDate: true,
        priority: true,
        status: true,
        Lead: {
          select: { Customer: { select: { id: true, name: true } } },
        },
        Opportunity: {
          select: { Customer: { select: { id: true, name: true } } },
        },
      },
    });

    const now = new Date();

    return tasks.map((task) => ({
      id: task.id,
      title: task.title,
      dueDate: task.dueDate,
      priority: task.priority,
      customerId:
        task.Lead?.Customer?.id || task.Opportunity?.Customer?.id || null,
      customerName:
        task.Lead?.Customer?.name || task.Opportunity?.Customer?.name || null,
      status: task.status,
      isOverdue: task.dueDate < now,
    }));
  }

  /**
   * Get quotation status breakdown
   */
  async getQuotationStatusBreakdown(): Promise<QuotationStatusBreakdownDto[]> {
    const quotations = await this.prisma.quotation.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: { id: true },
      _sum: { grandTotal: true },
    });

    return quotations.map((quot) => ({
      status: quot.status,
      count: quot._count.id,
      totalValue: quot._sum.grandTotal || 0,
    }));
  }

  /**
   * Get materials with low stock alerts
   */
  async getMaterialStockAlerts(): Promise<MaterialStockAlertDto[]> {
    const materials = await this.prisma.material.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        currentStock: { not: null },
        minStock: { not: null },
      },
      select: {
        id: true,
        partNumber: true,
        name: true,
        currentStock: true,
        minStock: true,
        Supplier: { select: { name: true } },
      },
    });

    const lowStockMaterials = materials
      .filter((m) => m.currentStock <= m.minStock)
      .map((m) => ({
        id: m.id,
        partNumber: m.partNumber,
        name: m.name,
        currentStock: m.currentStock,
        minStock: m.minStock,
        stockPercentage:
          m.minStock > 0 ? (m.currentStock / m.minStock) * 100 : 0,
        supplierName: m.Supplier?.name || 'No Supplier',
      }))
      .sort((a, b) => a.stockPercentage - b.stockPercentage);

    return lowStockMaterials;
  }
}
