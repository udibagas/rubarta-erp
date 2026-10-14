import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';
import { LoginDto } from './login.dto';
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
    );

    if ('twoFactorRequired' in data) {
      res.cookie('_csrf', req.csrfToken());
      return data;
    }

    await this.setSessionCookies(req, res, data.token);
    return data;
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
    );
    await this.setSessionCookies(req, res, data.token);
    return data;
  }

  @Post('2fa')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enable or disable two-factor authentication' })
  toggleTwoFactor(@Auth() user: User, @Body() dto: ToggleTwoFactorDto) {
    return this.authService.setTwoFactor(user.id, dto.enabled, dto.password);
  }

  private async setSessionCookies(req, res: Response, token: string) {
    const company = await this.prisma.company.findFirst({
      where: {
        isDefault: true,
      },
    });
    if (company) res.cookie('companyId', company.id);
    res.cookie('token', token);
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
    return { message: 'See you next time!' };
  }
}
