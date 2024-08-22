import { Injectable } from '@nestjs/common';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateLeadDto) {
    return this.prisma.lead.create({ data });
  }

  findAll() {
    return this.prisma.lead.findMany();
  }

  findOne(id: number) {
    return this.prisma.lead.findUniqueOrThrow({ where: { id } });
  }

  update(id: number, data: UpdateLeadDto) {
    return this.prisma.lead.update({ data, where: { id } });
  }

  remove(id: number) {
    return this.prisma.lead.delete({ where: { id } });
  }
}
