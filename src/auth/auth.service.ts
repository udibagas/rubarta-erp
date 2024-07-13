import { UsersService } from './../users/users.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new UnauthorizedException();
    const verified = await bcrypt.compare(password, user.password);
    if (!verified) throw new UnauthorizedException();
    const { id: sub, name, roles } = user;
    const payload = { sub, name, email, roles: roles.map((r) => r.role) };
    const token = this.jwtService.sign(payload);
    return { token };
  }
}
