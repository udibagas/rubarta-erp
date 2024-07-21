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
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthEntity } from './auth.entity';
import { Auth } from './auth.decorator';
import { User } from '@prisma/client';
import { Response } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in by email and password' })
  @ApiOkResponse({ type: AuthEntity })
  async signIn(
    @Body() credential: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthEntity> {
    const data = await this.authService.signIn(
      credential.email,
      credential.password,
    );

    res.cookie('token', data.token);
    return data;
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  me(@Auth() user: User) {
    return user;
  }

  @Public()
  @Get('/csrf')
  getCsrfToken(@Req() req, @Res({ passthrough: true }) res: Response): any {
    const token = req.csrfToken();
    return { token };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token');
    return { message: 'See you next time!' };
  }
}
