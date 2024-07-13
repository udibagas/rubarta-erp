import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  create(createUserDto: CreateUserDto) {
    createUserDto.password = bcrypt.hashSync(createUserDto.password, 10);
    return this.prisma.user.create({
      data: createUserDto,
      include: {
        roles: true,
      },
    });
  }

  findAll() {
    return this.prisma.user.findMany({
      orderBy: { name: 'asc' },
      include: {
        roles: true,
      },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: true,
      },
    });

    if (!user) throw new NotFoundException();

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    if (updateUserDto.password) {
      updateUserDto.password = bcrypt.hashSync(updateUserDto.password, 10);
    }

    await this.findOne(id);
    return this.prisma.user.update({
      data: updateUserDto,
      where: { id },
      include: {
        roles: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.user.delete({ where: { id } });
  }

  findByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email },
      include: {
        roles: true,
      },
    });
  }
}
