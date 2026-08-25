import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { IS_PUBLIC_KEY } from './public.decorator';
import { type ContextType } from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private userService: UsersService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const contextType: ContextType | 'graphql' = context.getType();
    let token: string;
    let request: any;

    if (contextType == 'graphql') {
      const ctx = context.getArgByIndex(2);
      request = ctx.req;
      token = ctx.req.cookies.token; // check di cookies aja
    } else {
      request = context.switchToHttp().getRequest();
      token = request.headers.authorization?.split(' ')[1];
      if (!token) token = request.cookies['token']; // check di cookie juga barangkali ada
    }

    if (!token) throw new UnauthorizedException();

    try {
      const decoded = this.jwtService.verify(token);
      const user = await this.userService.findOne(decoded.sub);
      if (!user.active) throw new UnauthorizedException();
      request.user = user;
    } catch (error) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
