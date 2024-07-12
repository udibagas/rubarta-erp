import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  create(createUserDto: CreateUserDto) {
    createUserDto.password = bcrypt.hashSync(createUserDto.password, 10);
    return this.prisma.user.create({ data: createUserDto });
  }

  findAll() {
    return this.prisma.user.findMany({
      orderBy: { name: 'asc' },
    });
  }

  findOne(id: number) {
    return this.prisma.user.findUniqueOrThrow({ where: { id } });
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    if (updateUserDto.password) {
      updateUserDto.password = bcrypt.hashSync(updateUserDto.password, 10);
    }

    return this.prisma.user.update({
      data: updateUserDto,
      where: { id },
    });
  }

  remove(id: number) {
    return this.prisma.user.delete({ where: { id } });
  }
}
