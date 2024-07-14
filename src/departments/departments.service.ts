import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  create(createDepartmentDto: CreateDepartmentDto) {
    return this.prisma.department.create({ data: createDepartmentDto });
  }

  findAll() {
    return this.prisma.department.findMany({
      orderBy: { code: 'asc' },
    });
  }

  findOne(id: number) {
    return this.prisma.department.findUnique({
      where: { id },
    });
  }

  update(id: number, updateDepartmentDto: UpdateDepartmentDto) {
    return this.prisma.department.update({
      data: updateDepartmentDto,
      where: { id },
    });
  }

  remove(id: number) {
    return this.prisma.department.delete({ where: { id } });
  }
}
