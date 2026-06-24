import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { PrismaService } from '../prisma/prisma.service';
import { LeadStatus, Prisma } from '../prisma/client/client';

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateLeadDto) {
    return this.prisma.lead.create({
      data,
      include: {
        Company: { select: { id: true, name: true } },
        Customer: {
          select: { id: true, name: true, email: true, phone: true },
        },
        User: { select: { id: true, name: true } },
      },
    });
  }

  async findAll(params: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    companyId?: number;
    userId?: number;
    status?: LeadStatus;
  }) {
    const where: Prisma.LeadWhereInput = {
      deletedAt: null,
    };
    const { page, pageSize, keyword, companyId, userId, status } = params;

    if (companyId) {
      where.companyId = companyId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (status) {
      where.status = status;
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
        },
        {
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
      skip: page && pageSize ? (page - 1) * pageSize : undefined,
      orderBy: { updatedAt: 'desc' },
      include: {
        Company: { select: { id: true, name: true } },
        Customer: {
          select: { id: true, name: true, email: true, phone: true },
        },
        User: { select: { id: true, name: true } },
      },
    });

    const total = await this.prisma.lead.count({ where });
    return { data, page, total };
  }

  async findOne(id: number) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, deletedAt: null },
      include: {
        Company: true,
        Customer: true,
        User: true,
      },
    });

    if (!lead) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }

    return lead;
  }

  async update(id: number, data: UpdateLeadDto) {
    await this.findOne(id); // Verify lead exists

    // If status is changed to Converted, set convertedDate
    if (data.status === LeadStatus.Converted) {
      data['convertedDate'] = new Date();
    }

    return this.prisma.lead.update({
      data,
      where: { id },
      include: {
        Company: { select: { id: true, name: true } },
        Customer: { select: { id: true, name: true } },
        User: { select: { id: true, name: true } },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Verify lead exists

    // Soft delete
    return this.prisma.lead.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
