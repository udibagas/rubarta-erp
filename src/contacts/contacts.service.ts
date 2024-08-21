import { Injectable } from '@nestjs/common';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateContactDto) {
    return this.prisma.contact.create({ data });
  }

  findAll(params: { keyword: string }) {
    const where: Prisma.ContactWhereInput = {};
    const { keyword } = params;

    if (keyword) {
      where.name = {
        contains: keyword,
      };
    }

    return this.prisma.contact.findMany({
      where,
      include: {
        Customer: {
          select: { name: true },
        },
      },
    });
  }

  findOne(id: number) {
    return this.prisma.contact.findUniqueOrThrow({
      where: { id },
      include: {
        Customer: {
          select: { name: true },
        },
      },
    });
  }

  update(id: number, data: UpdateContactDto) {
    return this.prisma.contact.update({ data, where: { id } });
  }

  remove(id: number) {
    return this.prisma.contact.delete({ where: { id } });
  }
}
