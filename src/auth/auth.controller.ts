import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
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

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in by email and password' })
  @ApiOkResponse({ type: AuthEntity })
  signIn(@Body() credential: LoginDto): Promise<AuthEntity> {
    return this.authService.signIn(credential.email, credential.password);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  me(@Auth() user: User) {
    return user;
  }
}
