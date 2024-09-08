import { Injectable } from '@nestjs/common';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class OpportunitiesService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateOpportunityDto) {
    return this.prisma.opportunity.create({ data });
  }

  async findAll(params: {
    page: number;
    pageSize: number;
    companyId: number;
    keyword: string;
  }) {
    const where: Prisma.OpportunityWhereInput = {};
    const { page, pageSize, companyId, keyword } = params;

    if (companyId) {
      where.companyId = companyId;
    }

    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { Customer: { name: { contains: keyword, mode: 'insensitive' } } },
      ];
    }

    const data = await this.prisma.opportunity.findMany({
      where,
      take: pageSize,
      skip: (page - 1) * pageSize,
      include: {
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
