import { UsersService } from './../users/users.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AUTH_TOKEN_TTL_SECONDS } from './auth.constants';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async signIn(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid email or password');
    if (!user.active)
      throw new UnauthorizedException('Invalid email or password');
    const verified = await bcrypt.compare(password, user.password);
    if (!verified) throw new UnauthorizedException('Invalid email or password');
    const { id: sub, name, email: userEmail, roles } = user;
    const payload = { sub, name, email: userEmail, roles };
    const sessionId = randomUUID();
    const token = await this.jwtService.signAsync(payload, {
      jwtid: sessionId,
      expiresIn: AUTH_TOKEN_TTL_SECONDS,
    });
    const expiresAt = new Date(Date.now() + AUTH_TOKEN_TTL_SECONDS * 1000);
    await this.prisma.authSession.deleteMany({
      where: { expiresAt: { lte: new Date() } },
    });
    await this.prisma.authSession.create({
      data: {
        jti: sessionId,
        userId: sub,
        expiresAt,
      },
    });
    const userResponse = { id: sub, name, email: userEmail, roles };
    return { token, user: userResponse };
  }

  async revokeSession(sessionId: string) {
    await this.prisma.authSession.updateMany({
      where: { jti: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
