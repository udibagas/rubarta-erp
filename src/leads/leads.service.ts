import { Injectable } from '@nestjs/common';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateLeadDto) {
    return this.prisma.lead.create({ data });
  }

  async findAll(params: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    companyId?: number;
  }) {
    const where: Prisma.LeadWhereInput = {};
    const { page, pageSize, keyword, companyId } = params;

    if (companyId) {
      where.companyId = companyId;
    }

    if (keyword) {
      where.OR = [
        {
          Customer: {
            name: {
              contains: keyword,
              mode: 'insensitive',
            },
          },
          notes: {
            contains: keyword,
            mode: 'insensitive',
          },
        },
      ];
    }

    const data = await this.prisma.lead.findMany({
      where,
      take: pageSize,
      skip: (page - 1) * pageSize,
      orderBy: { updatedAt: 'desc' },
      include: {
        Company: { select: { name: true } },
        Customer: { select: { name: true } },
        User: { select: { name: true } },
      },
    });

    const total = await this.prisma.lead.count({ where });
    return { data, page, total };
  }

  findOne(id: number) {
    return this.prisma.lead.findUniqueOrThrow({
      where: { id },
      include: {
        Company: { select: { name: true } },
        Customer: { select: { name: true } },
        User: { select: { name: true } },
      },
    });
  }

  update(id: number, data: UpdateLeadDto) {
    return this.prisma.lead.update({ data, where: { id } });
  }

  remove(id: number) {
    return this.prisma.lead.delete({ where: { id } });
  }
}
