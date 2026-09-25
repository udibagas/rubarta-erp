import { Injectable } from '@nestjs/common';
import { CreateUserDto, QueryUserDto, UpdateUserDto } from './user.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as fs from 'node:fs/promises';
import { Prisma, User } from '../prisma/client/client';

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

  async findAll(query: QueryUserDto) {
    const where: Prisma.UserWhereInput = {};

    if (query.keyword) {
      where.OR = [
        { name: { contains: query.keyword, mode: 'insensitive' } },
        { email: { contains: query.keyword, mode: 'insensitive' } },
      ];
    }

    const skip = query?.page ? (Number(query.page) - 1) * Number(query.pageSize || 10) : undefined;
    const take = query?.pageSize ? Number(query.pageSize) : undefined; 

    const data = await this.prisma.user.findMany({
      orderBy: { name: 'asc' },
      omit: { password: true },
      where,
      include: {
        Department: true,
        Bank: true,
      },
      skip,
      take,
    });

    if (query.page && query.pageSize) {
      const total = await this.prisma.user.count({ where });
      return { data, total, };
    }

    return data;
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

  getBalance(user: User) {
    return this.prisma.userBalance.findMany({
      orderBy: { user: { name: 'asc' } },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      where: {
        userId: user.roles.includes('ADMIN') ? undefined : user.id,
      },
    });
  }
}
