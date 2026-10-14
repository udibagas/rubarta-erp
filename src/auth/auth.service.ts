import { UsersService } from './../users/users.service';
import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import { createHash, randomBytes, randomInt, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import {
  AUTH_TOKEN_TTL_SECONDS,
  PASSWORD_RESET_TTL_MS,
  REFRESH_TOKEN_TTL_MS,
  TWO_FACTOR_CODE_TTL_MS,
  TRUSTED_DEVICE_TTL_MS,
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

  async signIn(
    email: string,
    password: string,
    context: { deviceToken?: string; userAgent?: string; ip?: string } = {},
  ) {
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

    if (
      user.twoFactorEnabled &&
      !(await this.isTrustedDevice(user.id, context))
    ) {
      const challengeId = await this.createTwoFactorChallenge(user);
      this.logger.log(`2FA code sent to user ${user.id}`);
      return { twoFactorRequired: true, challengeId };
    }

    this.logger.log(`User ${user.id} signed in`);
    return this.issueSession(user);
  }

  async verifyTwoFactor(
    challengeId: string,
    code: string,
    context: { userAgent?: string; ip?: string } = {},
  ) {
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
    const deviceToken = await this.trustDevice(challenge.userId, context);
    return { ...(await this.issueSession(challenge.User)), deviceToken };
  }

  // A device is trusted when it presents the secret cookie issued after a
  // successful OTP. UA and IP are only recorded for auditing since both can
  // change legitimately (browser updates, mobile networks) or be spoofed.
  private async isTrustedDevice(
    userId: number,
    context: { deviceToken?: string; userAgent?: string; ip?: string },
  ) {
    if (!context.deviceToken) return false;
    const now = new Date();
    const { count } = await this.prisma.trustedDevice.updateMany({
      where: {
        userId,
        tokenHash: this.hashToken(context.deviceToken),
        expiresAt: { gt: now },
      },
      data: {
        lastUsedAt: now,
        userAgent: context.userAgent?.slice(0, 255),
        ipAddress: context.ip?.slice(0, 64),
      },
    });
    return count > 0;
  }

  private async trustDevice(
    userId: number,
    context: { userAgent?: string; ip?: string },
  ) {
    const deviceToken = randomBytes(32).toString('hex');
    await this.prisma.trustedDevice.deleteMany({
      where: { expiresAt: { lte: new Date() } },
    });
    await this.prisma.trustedDevice.create({
      data: {
        userId,
        tokenHash: this.hashToken(deviceToken),
        userAgent: context.userAgent?.slice(0, 255),
        ipAddress: context.ip?.slice(0, 64),
        expiresAt: new Date(Date.now() + TRUSTED_DEVICE_TTL_MS),
      },
    });
    return deviceToken;
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

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: enabled },
      }),
      this.prisma.trustedDevice.deleteMany({ where: { userId } }),
    ]);
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

  async refreshSession(refreshToken: string) {
    const invalid = new UnauthorizedException(
      'Invalid or expired refresh token',
    );
    const now = new Date();
    const expiresAt = new Date(now.getTime() + REFRESH_TOKEN_TTL_MS);
    const session = await this.prisma.authSession.findFirst({
      where: {
        refreshTokenHash: this.hashToken(refreshToken),
        revokedAt: null,
        expiresAt: { gt: now },
      },
      include: { User: true },
    });

    if (!session || !session.User.active) throw invalid;

    const nextRefreshToken = randomBytes(32).toString('hex');
    const token = await this.createAccessToken(session.User, session.jti);
    const rotated = await this.prisma.authSession.updateMany({
      where: {
        id: session.id,
        refreshTokenHash: this.hashToken(refreshToken),
        revokedAt: null,
        expiresAt: { gt: now },
      },
      data: {
        refreshTokenHash: this.hashToken(nextRefreshToken),
        expiresAt,
      },
    });
    if (rotated.count === 0) throw invalid;

    return {
      token,
      refreshToken: nextRefreshToken,
      user: {
        id: session.User.id,
        name: session.User.name,
        email: session.User.email,
        roles: session.User.roles,
      },
    };
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

  async forgotPassword(email: string) {
    const user = await this.userService.findByEmail(email);
    if (!user || !user.active) {
      this.logger.warn(
        'Password reset requested for unknown or inactive email',
      );
      return;
    }

    const token = randomBytes(32).toString('hex');
    await this.prisma.$transaction([
      this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
      this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: this.hashToken(token),
          expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
        },
      }),
    ]);

    const baseUrl = (
      process.env.FRONTEND_URL ?? 'https://erp.rubarta.co.id'
    ).replace(/\/+$/, '');
    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Reset your password',
        template: 'reset-password',
        context: {
          name: user.name,
          resetUrl: `${baseUrl}/reset-password?token=${token}`,
          minutes: PASSWORD_RESET_TTL_MS / 60000,
        },
      });
      this.logger.log(`Password reset email sent to user ${user.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to user ${user.id}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async resetPassword(token: string, password: string) {
    const invalid = new BadRequestException('Invalid or expired reset link');
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: this.hashToken(token) },
    });
    if (!record || record.usedAt || record.expiresAt <= new Date())
      throw invalid;

    // Atomically claim the token so it can only be used once
    const claimed = await this.prisma.passwordResetToken.updateMany({
      where: { id: record.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (claimed.count === 0) throw invalid;

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { password: await bcrypt.hash(password, 10) },
      }),
      this.prisma.authSession.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      this.prisma.trustedDevice.deleteMany({
        where: { userId: record.userId },
      }),
      this.prisma.passwordResetToken.deleteMany({
        where: { userId: record.userId },
      }),
    ]);
    this.logger.log(`Password reset completed for user ${record.userId}`);
    return { message: 'Password has been reset. Please sign in.' };
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async issueSession(user: {
    id: number;
    name: string;
    email: string;
    roles: string[];
  }) {
    const { id: sub, name, email, roles } = user;
    const sessionId = randomUUID();
    const token = await this.createAccessToken(user, sessionId);
    const refreshToken = randomBytes(32).toString('hex');
    await this.prisma.authSession.deleteMany({
      where: { expiresAt: { lte: new Date() } },
    });
    await this.prisma.authSession.create({
      data: {
        jti: sessionId,
        refreshTokenHash: this.hashToken(refreshToken),
        userId: sub,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    });
    return {
      token,
      refreshToken,
      user: { id: sub, name, email, roles },
    };
  }

  private createAccessToken(
    user: { id: number; name: string; email: string; roles: string[] },
    sessionId: string,
  ) {
    const { id: sub, name, email, roles } = user;
    return this.jwtService.signAsync(
      { sub, name, email, roles },
      { jwtid: sessionId, expiresIn: AUTH_TOKEN_TTL_SECONDS },
    );
  }
}
