import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

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

  findAll() {
    return this.prisma.user.findMany({
      orderBy: { name: 'asc' },
      omit: {
        password: true,
      },
    });
  }

  findOne(id: number) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id },
      omit: {
        password: true,
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
      omit: {
        password: true,
      },
    });
  }

  remove(id: number) {
    return this.prisma.user.delete({
      where: { id },
      omit: {
        password: true,
      },
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email },
    });
  }
}
