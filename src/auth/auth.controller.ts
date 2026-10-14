import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';
import { LoginDto } from './login.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './password-reset.dto';
import { ToggleTwoFactorDto, VerifyTwoFactorDto } from './two-factor.dto';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthEntity } from './auth.entity';
import { Auth } from './auth.decorator';
import { User } from '../prisma/client/client';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import {
  REFRESH_TOKEN_TTL_MS,
  TRUSTED_DEVICE_COOKIE,
  TRUSTED_DEVICE_TTL_MS,
} from './auth.constants';

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private prisma: PrismaService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in by email and password' })
  @ApiOkResponse({ type: AuthEntity })
  async signIn(
    @Req() req,
    @Body() credential: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthEntity> {
    const data = await this.authService.signIn(
      credential.email,
      credential.password,
      {
        deviceToken: req.cookies?.[TRUSTED_DEVICE_COOKIE],
        userAgent: req.headers['user-agent'],
        ip: req.ip,
      },
    );

    if ('twoFactorRequired' in data) {
      res.cookie('_csrf', req.csrfToken());
      return data;
    }

    await this.setSessionCookies(req, res, data.token, data.refreshToken);
    return { token: data.token, user: data.user };
  }

  @Public()
  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete sign in with the emailed code' })
  @ApiOkResponse({ type: AuthEntity })
  async verifyTwoFactor(
    @Req() req,
    @Body() dto: VerifyTwoFactorDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthEntity> {
    const data = await this.authService.verifyTwoFactor(
      dto.challengeId,
      dto.code,
      { userAgent: req.headers['user-agent'], ip: req.ip },
    );
    res.cookie(TRUSTED_DEVICE_COOKIE, data.deviceToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth/login',
      maxAge: TRUSTED_DEVICE_TTL_MS,
    });
    await this.setSessionCookies(req, res, data.token, data.refreshToken);
    return { token: data.token, user: data.user };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Email a password reset link' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return {
      message: 'If the email is registered, a reset link has been sent.',
    };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set a new password using the emailed token' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @Post('2fa')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enable or disable two-factor authentication' })
  toggleTwoFactor(@Auth() user: User, @Body() dto: ToggleTwoFactorDto) {
    return this.authService.setTwoFactor(user.id, dto.enabled, dto.password);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh the access token' })
  @ApiOkResponse({ type: AuthEntity })
  async refresh(
    @Req() req,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthEntity> {
    const refreshToken = req.cookies?.refreshToken;
    if (typeof refreshToken !== 'string') {
      throw new UnauthorizedException('Refresh token is required');
    }

    const data = await this.authService.refreshSession(refreshToken);
    await this.setSessionCookies(req, res, data.token, data.refreshToken);
    return { token: data.token, user: data.user };
  }

  private async setSessionCookies(
    req,
    res: Response,
    token: string,
    refreshToken: string,
  ) {
    const company = await this.prisma.company.findFirst({
      where: {
        isDefault: true,
      },
    });
    if (company) res.cookie('companyId', company.id);
    res.cookie('token', token);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth/refresh',
      maxAge: REFRESH_TOKEN_TTL_MS,
    });
    res.cookie('_csrf', req.csrfToken());
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  me(@Auth() user: User) {
    return user;
  }

  @Public()
  @Get('csrf')
  getCsrfToken(@Req() req, @Res({ passthrough: true }) res: Response): any {
    const token = req.csrfToken();
    res.cookie('_csrf', req.csrfToken());
    return { token };
  }

  @Post('logout')
  async logout(@Req() req, @Res({ passthrough: true }) res: Response) {
    await this.authService.revokeSession(req.authSessionId);
    res.clearCookie('token');
    res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
    return { message: 'See you next time!' };
  }
}
