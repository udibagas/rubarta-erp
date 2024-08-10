import { Injectable, NotFoundException } from '@nestjs/common';
import { DepartmentDto } from './department.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  create(departmentDto: DepartmentDto) {
    return this.prisma.department.create({ data: departmentDto });
  }

  findAll() {
    return this.prisma.department.findMany({
      orderBy: { code: 'asc' },
    });
  }

  findOne(id: number) {
    return this.prisma.department.findUniqueOrThrow({
      where: { id },
    });
  }

  update(id: number, departmentDto: DepartmentDto) {
    return this.prisma.department.update({
      data: departmentDto,
      where: { id },
    });
  }

  remove(id: number) {
    return this.prisma.department.delete({ where: { id } });
  }
}
