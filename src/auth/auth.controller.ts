import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post()
  signIn(@Body() { email, password }): Promise<{ token: string }> {
    return this.authService.signIn(email, password);
  }

  @Get('me')
  me(@Request() req) {
    return req.user;
  }
}
