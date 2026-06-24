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

    if (query.type) {
      where.type = query.type;
    }

    if (query.keyword) {
      where.OR = [
        { subject: { contains: query.keyword, mode: 'insensitive' } },
        { notes: { contains: query.keyword, mode: 'insensitive' } },
        { outcome: { contains: query.keyword, mode: 'insensitive' } },
      ];
    }

    return this.prisma.interaction.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        User: { select: { id: true, name: true } },
      },
    });
  }

  async findOne(id: number) {
    const interaction = await this.prisma.interaction.findFirst({
      where: { id, deletedAt: null },
      include: {
        User: true,
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
