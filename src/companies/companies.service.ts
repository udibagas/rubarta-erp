import { Injectable } from '@nestjs/common';
import { CreateCompanyDto, UpdateCompanyDto } from './company.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  create(companyDto: CreateCompanyDto) {
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

  async update(id: number, companyDto: UpdateCompanyDto) {
    if (companyDto.isDefault) {
      await this.prisma.company.updateMany({
        data: { isDefault: false },
        where: { isDefault: true },
      });
    }

    return this.prisma.company.update({
      where: { id },
      data: companyDto,
    });
  }

  remove(id: number) {
    return this.prisma.company.delete({ where: { id } });
  }
}
