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
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthEntity } from './auth.entity';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AuthEntity })
  signIn(@Body() credential: LoginDto): Promise<AuthEntity> {
    return this.authService.signIn(credential.email, credential.password);
  }

  @Get()
  me(@Request() req) {
    return req.user;
  }
}
