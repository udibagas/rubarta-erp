import { Injectable, NotFoundException } from '@nestjs/common';
import { Customer, Prisma } from '../prisma/client/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  QueryCustomerDto,
} from './customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryCustomerDto): Promise<Customer[]> {
    const where: Prisma.CustomerWhereInput = {
      deletedAt: null,
    };

    if (query.keyword) {
      where.OR = [
        { name: { contains: query.keyword, mode: 'insensitive' } },
        { email: { contains: query.keyword, mode: 'insensitive' } },
      ];
    }

    if (query.industry) {
      where.industry = query.industry;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    return this.prisma.customer.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            Contacts: true,
            Leads: true,
            Opportunities: true,
            Orders: true,
          },
        },
      },
    });
  }

  async findOne(id: number): Promise<Customer> {
    const customer = await this.prisma.customer.findFirst({
      where: { id, deletedAt: null },
      include: {
        Contacts: { where: { deletedAt: null } },
        Leads: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          include: {
            User: { select: { name: true } },
          },
        },
        Opportunities: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          include: {
            User: { select: { name: true } },
          },
        },
        Orders: {
          orderBy: { date: 'desc' },
        },
        Interactions: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          include: {
            User: { select: { name: true } },
          },
        },
        Quotations: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          include: {
            User: { select: { name: true } },
          },
        },
        Invoices: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            Contacts: true,
            Leads: true,
            Opportunities: true,
            Orders: true,
            Tasks: true,
            Interactions: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return customer;
  }

  async create(data: CreateCustomerDto): Promise<Customer> {
    return this.prisma.customer.create({
      data,
    });
  }

  async update(id: number, data: UpdateCustomerDto): Promise<Customer> {
    await this.findOne(id); // Verify customer exists

    return this.prisma.customer.update({
      where: { id },
      data,
    });
  }

  async remove(id: number): Promise<Customer> {
    await this.findOne(id); // Verify customer exists

    // Soft delete
    return this.prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
