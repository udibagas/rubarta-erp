import { Injectable, NotFoundException } from '@nestjs/common';
import { CompanyDto } from './company.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  create(companyDto: CompanyDto) {
    return this.prisma.company.create({ data: companyDto });
  }

  findAll() {
    return this.prisma.company.findMany({
      orderBy: { code: 'asc' },
    });
  }

  findOne(id: number) {
    return this.prisma.company.findUniqueOrThrow({ where: { id } });
  }

  update(id: number, companyDto: CompanyDto) {
    return this.prisma.company.update({
      data: companyDto,
      where: { id },
    });
  }

  remove(id: number) {
    return this.prisma.company.delete({ where: { id } });
  }
}
