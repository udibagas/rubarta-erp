import { Injectable } from '@nestjs/common';
import {
  CreateOpportunityDto,
  UpdateOpportunityDto,
  OpportunityQueryDto,
} from './dto/opportunity.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../prisma/client/client';

@Injectable()
export class OpportunitiesService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateOpportunityDto) {
    return this.prisma.opportunity.create({ data });
  }

  async findAll(params: OpportunityQueryDto) {
    const where: Prisma.OpportunityWhereInput = {};
    const {
      page = 1,
      pageSize = 10,
      companyId,
      customerId,
      leadId,
      keyword,
      sortBy,
      sortOrder,
    } = params;

    if (companyId) {
      where.companyId = Number(companyId);
    }

    if (leadId) {
      where.leadId = Number(leadId);
    }

    if (customerId) {
      where.customerId = Number(customerId);
    }

    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { Customer: { name: { contains: keyword, mode: 'insensitive' } } },
      ];
    }

    const data = await this.prisma.opportunity.findMany({
      where,
      take: Number(pageSize),
      skip: (Number(page) - 1) * Number(pageSize),
      orderBy: sortBy
        ? { [sortBy]: sortOrder || 'asc' }
        : { createdAt: 'desc' },
      include: {
        Company: { select: { name: true } },
        User: { select: { name: true } },
        Customer: { select: { name: true } },
      },
    });

    const total = await this.prisma.opportunity.count({ where });
    return { data, page, total };
  }

  findOne(id: number) {
    return this.prisma.opportunity.findUniqueOrThrow({
      where: { id },
      include: {
        User: { select: { name: true } },
        Customer: { select: { name: true } },
        Company: { select: { name: true } },
      },
    });
  }

  update(id: number, data: UpdateOpportunityDto) {
    return this.prisma.opportunity.update({ data, where: { id } });
  }

  remove(id: number) {
    return this.prisma.opportunity.delete({ where: { id } });
  }
}
