import { Injectable } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TestService {
  private user;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async createUser() {
    const password = await bcrypt.hash('password', 10);
    const user = await this.prisma.user.create({
      data: {
        name: 'Admin',
        email: 'admin@mail.com',
        password: password,
        roles: ['ADMIN'],
      },
    });

    this.user = user;
    return user;
  }

  createToken() {
    const { id: sub, name, roles, email } = this.user;
    const payload = { sub, name, email, roles };
    const token = this.jwtService.sign(payload);
    return token;
  }

  deleteUser() {
    return this.prisma.user.deleteMany({});
  }

  deleteCompanies() {
    return this.prisma.company.deleteMany({});
  }
}
