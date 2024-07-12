import { Body, Controller, Get, HttpCode, Post, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';
import { LoginDto } from './login.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post()
  @HttpCode(200)
  signIn(@Body() credential: LoginDto): Promise<{ token: string }> {
    return this.authService.signIn(credential.email, credential.password);
  }

  @Get()
  me(@Request() req) {
    return req.user;
  }
}
