import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  create(createUserDto: CreateUserDto) {
    createUserDto.password = bcrypt.hashSync(createUserDto.password, 10);
    return this.prisma.user.create({
      data: createUserDto,
      omit: {
        password: true,
      },
    });
  }

  findAll(keyword?: string) {
    const where: Prisma.UserWhereInput = {};

    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { email: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    return this.prisma.user.findMany({
      orderBy: { name: 'asc' },
      omit: { password: true },
      where,
      include: {
        Department: true,
        Bank: true,
      },
    });
  }

  findOne(id: number) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id },
      omit: { password: true },
      include: {
        Department: true,
        Bank: true,
      },
    });
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    if (updateUserDto.password) {
      updateUserDto.password = bcrypt.hashSync(updateUserDto.password, 10);
    }

    return this.prisma.user.update({
      data: updateUserDto,
      where: { id },
      omit: { password: true },
    });
  }

  remove(id: number) {
    return this.prisma.user.delete({
      where: { id },
      omit: { password: true },
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email },
    });
  }
}
