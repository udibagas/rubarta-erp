import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  create(createCompanyDto: CreateCompanyDto) {
    return this.prisma.company.create({ data: createCompanyDto });
  }

  findAll() {
    return this.prisma.company.findMany({
      orderBy: { code: 'asc' },
    });
  }

  findOne(id: number) {
    return this.prisma.company.findUniqueOrThrow({ where: { id } });
  }

  update(id: number, updateCompanyDto: UpdateCompanyDto) {
    return this.prisma.company.update({
      data: updateCompanyDto,
      where: { id },
    });
  }

  remove(id: number) {
    return this.prisma.company.delete({ where: { id } });
  }
}
