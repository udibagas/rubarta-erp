import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateContactDto,
  QueryContactDto,
  UpdateContactDto,
} from './contact.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../prisma/client/client';

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateContactDto) {
    // If this contact is primary, unset other primary contacts for the same customer
    if (data.isPrimary) {
      await this.prisma.contact.updateMany({
        where: {
          customerId: data.customerId,
          isPrimary: true,
        },
        data: {
          isPrimary: false,
        },
      });
    }

    return this.prisma.contact.create({
      data,
      include: {
        Customer: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async findAll(params: QueryContactDto) {
    const where: Prisma.ContactWhereInput = {
      deletedAt: null,
    };

    const { keyword, customerId, isActive } = params;

    if (customerId) {
      where.customerId = parseInt(customerId, 10);
    }

    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { email: { contains: keyword, mode: 'insensitive' } },
        { phone: { contains: keyword, mode: 'insensitive' } },
        { position: { contains: keyword, mode: 'insensitive' } },
        { Customer: { name: { contains: keyword, mode: 'insensitive' } } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const take = params.pageSize ? parseInt(params.pageSize, 10) : undefined;
    const skip =
      params.page && params.pageSize
        ? (Number(params.page) - 1) * Number(params.pageSize)
        : undefined;

    const data = await this.prisma.contact.findMany({
      where,
      skip,
      take,
      orderBy: [{ name: 'asc' }, { Customer: { name: 'asc' } }],
      include: {
        Customer: {
          select: { id: true, name: true },
        },
      },
    });

    if (params.page && params.pageSize) {
      const total = await this.prisma.contact.count({ where });
      return { data, total };
    }

    return data;
  }

  async findOne(id: number) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, deletedAt: null },
      include: {
        Customer: true,
      },
    });

    if (!contact) {
      throw new NotFoundException(`Contact with ID ${id} not found`);
    }

    return contact;
  }

  async update(id: number, data: UpdateContactDto) {
    await this.findOne(id); // Verify contact exists

    // If this contact is being set as primary, unset other primary contacts
    if (data.isPrimary) {
      const contact = await this.prisma.contact.findUnique({ where: { id } });
      await this.prisma.contact.updateMany({
        where: {
          customerId: contact.customerId,
          isPrimary: true,
          id: { not: id },
        },
        data: {
          isPrimary: false,
        },
      });
    }

    return this.prisma.contact.update({
      data,
      where: { id },
      include: {
        Customer: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Verify contact exists

    // Soft delete
    return this.prisma.contact.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
