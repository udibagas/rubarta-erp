import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import { createHash } from 'crypto';
import { AuthService } from '../src/auth/auth.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { UsersService } from '../src/users/users.service';
import { REFRESH_TOKEN_TTL_MS } from '../src/auth/auth.constants';

describe('AuthService refreshSession', () => {
  let authService: AuthService;
  let findFirst: jest.Mock;
  let updateMany: jest.Mock;
  let signAsync: jest.Mock;
  let module: TestingModule;

  const refreshToken = 'original-refresh-token';
  const user = {
    id: 12,
    name: 'Test User',
    email: 'test@example.com',
    roles: ['USER'],
    active: true,
  };
  const session = {
    id: 1,
    jti: 'session-id',
    refreshTokenHash: createHash('sha256').update(refreshToken).digest('hex'),
    userId: user.id,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    revokedAt: null,
    createdAt: new Date(),
    User: user,
  };

  beforeEach(async () => {
    findFirst = jest.fn().mockResolvedValue(session);
    updateMany = jest.fn().mockResolvedValue({ count: 1 });
    signAsync = jest.fn().mockResolvedValue('new-access-token');

    module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: {} },
        { provide: JwtService, useValue: { signAsync } },
        {
          provide: PrismaService,
          useValue: { authSession: { findFirst, updateMany } },
        },
        { provide: MailerService, useValue: {} },
      ],
    }).compile();
    authService = module.get(AuthService);
  });

  afterEach(async () => {
    await module.close();
  });

  it('returns a new access token and atomically rotates the refresh token', async () => {
    const result = await authService.refreshSession(refreshToken);

    expect(result.token).toBe('new-access-token');
    expect(result.refreshToken).not.toBe(refreshToken);
    expect(result.user).toEqual({
      id: user.id,
      name: user.name,
      email: user.email,
      roles: user.roles,
    });
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          refreshTokenHash: session.refreshTokenHash,
          revokedAt: null,
        }),
        include: { User: true },
      }),
    );
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: session.id,
          refreshTokenHash: session.refreshTokenHash,
        }),
        data: expect.objectContaining({
          refreshTokenHash: createHash('sha256')
            .update(result.refreshToken)
            .digest('hex'),
          expiresAt: expect.any(Date),
        }),
      }),
    );
  });

  it('rejects an inactive user', async () => {
    findFirst.mockResolvedValue({
      ...session,
      User: { ...user, active: false },
    });

    await expect(
      authService.refreshSession(refreshToken),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(updateMany).not.toHaveBeenCalled();
  });

  it('rejects a refresh token that lost a concurrent rotation race', async () => {
    updateMany.mockResolvedValue({ count: 0 });

    await expect(
      authService.refreshSession(refreshToken),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
