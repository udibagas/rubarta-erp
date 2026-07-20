import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateInteractionDto,
  UpdateInteractionDto,
  QueryInteractionDto,
} from './dto/interaction.dto';
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

    // If pagination is requested
    if (query.isPaginated) {
      const page = query.page || 1;
      const limit = query.limit || 10;
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        this.prisma.interaction.findMany({
          where,
          orderBy,
          include,
          skip,
          take: limit,
        }),
        this.prisma.interaction.count({ where }),
      ]);

      return { data, page, total };
    }

    // Return all results without pagination
    return this.prisma.interaction.findMany({
      where,
      orderBy,
      include,
    });
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
