import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto, QueryTaskDto } from './dto/task.dto';
import { Prisma, TaskStatus } from '../prisma/client/client';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateTaskDto) {
    return this.prisma.task.create({
      data,
      include: {
        User: { select: { id: true, name: true } },
      },
    });
  }

  async findAll(query: QueryTaskDto) {
    const where: Prisma.TaskWhereInput = {
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

    if (query.status) {
      where.status = query.status;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    if (query.keyword) {
      where.OR = [
        { title: { contains: query.keyword, mode: 'insensitive' } },
        { description: { contains: query.keyword, mode: 'insensitive' } },
      ];
    }

    const orderBy = [
      { priority: 'desc' },
      { dueDate: 'asc' },
    ] as Prisma.TaskOrderByWithRelationInput[];
    const include = {
      User: { select: { id: true, name: true } },
    };

    // If pagination is requested
    if (query.isPaginated) {
      const page = query.page || 1;
      const limit = query.limit || 10;
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        this.prisma.task.findMany({
          where,
          orderBy,
          include,
          skip,
          take: limit,
        }),
        this.prisma.task.count({ where }),
      ]);

      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }

    // Return all results without pagination
    return this.prisma.task.findMany({
      where,
      orderBy,
      include,
    });
  }

  async findOne(id: number) {
    const task = await this.prisma.task.findFirst({
      where: { id, deletedAt: null },
      include: {
        User: true,
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  async update(id: number, data: UpdateTaskDto) {
    await this.findOne(id); // Verify exists

    // If status is changed to Completed, set completedAt
    if (data.status === TaskStatus.Completed) {
      data['completedAt'] = new Date();
    }

    return this.prisma.task.update({
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
    return this.prisma.task.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
