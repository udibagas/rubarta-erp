import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateVisitPlanDto } from './dto/create-visit-plan.dto';
import { UpdateVisitPlanDto } from './dto/update-visit-plan.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, VisitPlanStatus, VisitType } from '../prisma/client/client';

@Injectable()
export class VisitPlansService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateVisitPlanDto) {
    return this.prisma.visitPlan.create({
      data,
      include: {
        Company: { select: { id: true, name: true } },
        Customer: {
          select: { id: true, name: true, email: true, phone: true },
        },
        User: { select: { id: true, name: true } },
        Contact: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            position: true,
          },
        },
      },
    });
  }

  async findAll(params: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    companyId?: number | string | number[] | string[];
    userId?: number | number[] | string | string[];
    customerId?: number | string | number[] | string[];
    status?: VisitPlanStatus | VisitPlanStatus[];
    visitType?: VisitType | VisitType[];
    startDate?: Date;
    endDate?: Date;
    year?: number;
    month?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const where: Prisma.VisitPlanWhereInput = {
      deletedAt: null,
    };
    const {
      page = 1,
      pageSize = 10,
      keyword,
      companyId,
      userId,
      customerId,
      status,
      visitType,
      startDate,
      endDate,
      year,
      month,
    } = params;

    if (companyId) {
      if (Array.isArray(companyId)) {
        where.companyId = { in: companyId.map((id) => +id) };
      } else {
        where.companyId = +companyId;
      }
    }

    if (userId) {
      if (Array.isArray(userId)) {
        where.userId = { in: userId.map((id) => +id) };
      } else {
        where.userId = +userId;
      }
    }

    if (customerId) {
      if (Array.isArray(customerId)) {
        where.customerId = { in: customerId.map((id) => +id) };
      } else {
        where.customerId = +customerId;
      }
    }

    if (status) {
      if (!Array.isArray(status)) {
        where.status = { in: [status] };
      } else {
        where.status = { in: status };
      }
    }

    if (visitType) {
      if (!Array.isArray(visitType)) {
        where.visitType = { in: [visitType] };
      } else {
        where.visitType = { in: visitType };
      }
    }

    // Handle year/month filtering
    if (year || month) {
      const filterYear = year || new Date().getFullYear();
      const filterMonth = month !== undefined ? month : 1;

      const start = new Date(
        filterYear,
        month !== undefined ? filterMonth - 1 : 0,
        1,
      );
      const end =
        month !== undefined
          ? new Date(filterYear, filterMonth, 0, 23, 59, 59, 999)
          : new Date(filterYear, 11, 31, 23, 59, 59, 999);

      where.scheduledDate = {
        gte: start,
        lte: end,
      };
    } else if (startDate || endDate) {
      where.scheduledDate = {};
      if (startDate) {
        where.scheduledDate.gte = startDate;
      }
      if (endDate) {
        where.scheduledDate.lte = endDate;
      }
    }

    if (keyword) {
      where.OR = [
        {
          title: {
            contains: keyword,
            mode: 'insensitive',
          },
        },
        {
          purpose: {
            contains: keyword,
            mode: 'insensitive',
          },
        },
        {
          Customer: {
            name: {
              contains: keyword,
              mode: 'insensitive',
            },
          },
        },
        {
          contactPerson: {
            contains: keyword,
            mode: 'insensitive',
          },
        },
      ];
    }

    const data = await this.prisma.visitPlan.findMany({
      where,
      take: pageSize,
      skip: (page - 1) * pageSize,
      orderBy: params.sortBy
        ? { [params.sortBy]: params.sortOrder || 'asc' }
        : { scheduledDate: 'desc' },
      include: {
        Company: { select: { id: true, name: true } },
        Customer: {
          select: { id: true, name: true, email: true, phone: true },
        },
        User: { select: { id: true, name: true } },
        Contact: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            position: true,
          },
        },
      },
    });

    const total = await this.prisma.visitPlan.count({ where });
    return { data, page, total };
  }

  async findOne(id: number) {
    const visitPlan = await this.prisma.visitPlan.findFirst({
      where: { id, deletedAt: null },
      include: {
        Company: true,
        Customer: true,
        User: true,
        Contact: true,
      },
    });

    if (!visitPlan) {
      throw new NotFoundException(`Visit plan with ID ${id} not found`);
    }

    return visitPlan;
  }

  async update(id: number, data: UpdateVisitPlanDto) {
    await this.findOne(id); // Verify visit plan exists

    return this.prisma.visitPlan.update({
      data,
      where: { id },
      include: {
        Company: { select: { id: true, name: true } },
        Customer: { select: { id: true, name: true } },
        User: { select: { id: true, name: true } },
        Contact: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            position: true,
          },
        },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Verify visit plan exists

    // Soft delete
    return this.prisma.visitPlan.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async complete(id: number, outcome?: string) {
    await this.findOne(id);

    return this.prisma.visitPlan.update({
      where: { id },
      data: {
        status: VisitPlanStatus.Completed,
        actualVisitDate: new Date(),
        outcome,
      },
      include: {
        Company: { select: { id: true, name: true } },
        Customer: { select: { id: true, name: true } },
        User: { select: { id: true, name: true } },
        Contact: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            position: true,
          },
        },
      },
    });
  }
}
