import { UsersService } from './../users/users.service';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import { randomInt, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import {
  AUTH_TOKEN_TTL_SECONDS,
  TWO_FACTOR_CODE_TTL_MS,
  TWO_FACTOR_MAX_ATTEMPTS,
} from './auth.constants';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly mailerService: MailerService,
  ) {}

  async signIn(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      this.logger.warn('Failed sign-in: unknown email');
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!user.active) {
      this.logger.warn(`Failed sign-in: inactive user ${user.id}`);
      throw new UnauthorizedException('Invalid email or password');
    }
    const verified = await bcrypt.compare(password, user.password);
    if (!verified) {
      this.logger.warn(`Failed sign-in: wrong password for user ${user.id}`);
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.twoFactorEnabled) {
      const challengeId = await this.createTwoFactorChallenge(user);
      this.logger.log(`2FA code sent to user ${user.id}`);
      return { twoFactorRequired: true, challengeId };
    }

    this.logger.log(`User ${user.id} signed in`);
    return this.issueSession(user);
  }

  async verifyTwoFactor(challengeId: string, code: string) {
    const invalid = new UnauthorizedException('Invalid or expired code');
    const challenge = await this.prisma.twoFactorChallenge.findUnique({
      where: { id: challengeId },
      include: { User: true },
    });

    if (!challenge) throw invalid;
    if (challenge.expiresAt <= new Date()) {
      await this.prisma.twoFactorChallenge.deleteMany({
        where: { id: challengeId },
      });
      throw invalid;
    }

    // atomic increment so concurrent guesses cannot exceed the limit
    const { count } = await this.prisma.twoFactorChallenge.updateMany({
      where: { id: challengeId, attempts: { lt: TWO_FACTOR_MAX_ATTEMPTS } },
      data: { attempts: { increment: 1 } },
    });
    if (count === 0) {
      await this.prisma.twoFactorChallenge.deleteMany({
        where: { id: challengeId },
      });
      throw invalid;
    }

    const matches = await bcrypt.compare(code, challenge.codeHash);
    if (!matches || !challenge.User.active) {
      this.logger.warn(`Failed 2FA verification for user ${challenge.userId}`);
      throw invalid;
    }

    // single use: only one concurrent request can consume the challenge
    const consumed = await this.prisma.twoFactorChallenge.deleteMany({
      where: { id: challengeId },
    });
    if (consumed.count === 0) throw invalid;

    this.logger.log(`User ${challenge.userId} signed in with 2FA`);
    return this.issueSession(challenge.User);
  }

  async setTwoFactor(userId: number, enabled: boolean, password: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    const verified = await bcrypt.compare(password, user.password);
    if (!verified) {
      this.logger.warn(
        `Failed 2FA setting change: wrong password, user ${userId}`,
      );
      throw new UnauthorizedException('Invalid password');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: enabled },
    });
    this.logger.log(`User ${userId} ${enabled ? 'enabled' : 'disabled'} 2FA`);
    return { twoFactorEnabled: enabled };
  }

  async revokeSession(sessionId: string) {
    await this.prisma.authSession.updateMany({
      where: { jti: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    this.logger.log(`Session ${sessionId} revoked`);
  }

  private async createTwoFactorChallenge(user: {
    id: number;
    name: string;
    email: string;
  }) {
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const challengeId = randomUUID();

    await this.prisma.twoFactorChallenge.deleteMany({
      where: { OR: [{ userId: user.id }, { expiresAt: { lte: new Date() } }] },
    });
    await this.prisma.twoFactorChallenge.create({
      data: {
        id: challengeId,
        userId: user.id,
        codeHash: await bcrypt.hash(code, 10),
        expiresAt: new Date(Date.now() + TWO_FACTOR_CODE_TTL_MS),
      },
    });

    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Your verification code',
        template: 'two-factor-code',
        context: {
          name: user.name,
          code,
          minutes: TWO_FACTOR_CODE_TTL_MS / 60000,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to send 2FA email to user ${user.id}`,
        error instanceof Error ? error.stack : String(error),
      );
      await this.prisma.twoFactorChallenge.deleteMany({
        where: { id: challengeId },
      });
      throw error;
    }

    return challengeId;
  }

  private async issueSession(user: {
    id: number;
    name: string;
    email: string;
    roles: string[];
  }) {
    const { id: sub, name, email, roles } = user;
    const sessionId = randomUUID();
    const token = await this.jwtService.signAsync(
      { sub, name, email, roles },
      { jwtid: sessionId, expiresIn: AUTH_TOKEN_TTL_SECONDS },
    );
    await this.prisma.authSession.deleteMany({
      where: { expiresAt: { lte: new Date() } },
    });
    await this.prisma.authSession.create({
      data: {
        jti: sessionId,
        userId: sub,
        expiresAt: new Date(Date.now() + AUTH_TOKEN_TTL_SECONDS * 1000),
      },
    });
    return { token, user: { id: sub, name, email, roles } };
  }
}
