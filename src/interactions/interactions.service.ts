import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateInteractionDto,
  UpdateInteractionDto,
  QueryInteractionDto,
} from './interaction.dto';
import { Prisma } from '../prisma/client/client';

@Injectable()
export class InteractionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateInteractionDto) {
    return this.prisma.interaction.create({
      data,
      include: {
        User: { select: { id: true, name: true } },
        Contact: { select: { id: true, name: true, email: true, phone: true } },
      },
    });
  }

  async findAll(query: QueryInteractionDto) {
    const where: Prisma.InteractionWhereInput = {
      deletedAt: null,
    };

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.leadId) {
      where.leadId = query.leadId;
    }

    if (query.opportunityId) {
      where.opportunityId = query.opportunityId;
    }

    if (query.contactId) {
      where.contactId = query.contactId;
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.customerId) {
      where.OR = [
        { Lead: { customerId: query.customerId } },
        { Opportunity: { customerId: query.customerId } },
      ];
    }

    if (query.keyword) {
      where.OR = [
        { subject: { contains: query.keyword, mode: 'insensitive' } },
        { notes: { contains: query.keyword, mode: 'insensitive' } },
        { outcome: { contains: query.keyword, mode: 'insensitive' } },
      ];
    }

    const orderBy = {
      date: 'desc',
    } as Prisma.InteractionOrderByWithRelationInput;
    const include = {
      User: { select: { id: true, name: true } },
      Contact: { select: { id: true, name: true, email: true, phone: true } },
    };

    const take = query.pageSize;
    const skip =
      query.page && query.pageSize
        ? (query.page - 1) * query.pageSize
        : undefined;

    const data = await this.prisma.interaction.findMany({
      where,
      orderBy,
      include,
      skip,
      take,
    });

    if (query.page && query.pageSize) {
      const total = await this.prisma.interaction.count({ where });
      return { data, total };
    }

    return data;
  }

  async findOne(id: number) {
    const interaction = await this.prisma.interaction.findFirst({
      where: { id, deletedAt: null },
      include: {
        User: true,
        Contact: true,
      },
    });

    if (!interaction) {
      throw new NotFoundException(`Interaction with ID ${id} not found`);
    }

    return interaction;
  }

  async update(id: number, data: UpdateInteractionDto) {
    await this.findOne(id); // Verify exists

    return this.prisma.interaction.update({
      where: { id },
      data,
      include: {
        User: { select: { id: true, name: true } },
        Contact: { select: { id: true, name: true, email: true, phone: true } },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Verify exists

    // Soft delete
    return this.prisma.interaction.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
