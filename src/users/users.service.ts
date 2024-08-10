import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as fs from 'node:fs/promises';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateUserDto) {
    data.code = await this.generateCode();
    data.password = bcrypt.hashSync(data.password, 10);
    return this.prisma.user.create({
      omit: { password: true },
      data,
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

  async remove(id: number) {
    const data = await this.findOne(id);

    if (data.signatureSpeciment) {
      const signatureSpeciment = data.signatureSpeciment as {
        filePath: string;
      };
      await fs.unlink(signatureSpeciment.filePath);
    }

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

  async generateCode(): Promise<string> {
    let code = '0001';

    const lastData = await this.prisma.user.findFirst({
      orderBy: { code: 'desc' },
    });

    if (lastData) {
      code = (Number(lastData.code) + 1).toString().padStart(4, '0');
    }

    return code;
  }
}
