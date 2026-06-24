import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
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

  findAll(params: {
    keyword?: string;
    customerId?: number;
    isActive?: boolean;
  }) {
    const where: Prisma.ContactWhereInput = {
      deletedAt: null,
    };

    const { keyword, customerId, isActive } = params;

    if (customerId) {
      where.customerId = customerId;
    }

    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { email: { contains: keyword, mode: 'insensitive' } },
        { Customer: { name: { contains: keyword, mode: 'insensitive' } } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return this.prisma.contact.findMany({
      where,
      orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
      include: {
        Customer: {
          select: { id: true, name: true },
        },
      },
    });
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
