import { User } from '../prisma/client/client';
import { ForbiddenException } from '@nestjs/common';
import { BasePolicy } from './base.policy';

export class AllowAdminOnlyPolicy extends BasePolicy {
  viewAny(user: User) {
    if (user.roles.includes('ADMIN')) return true;
    throw new ForbiddenException();
  }

  create(user: User) {
    if (user.roles.includes('ADMIN')) return true;
    throw new ForbiddenException();
  }

  view(model: unknown, user: User) {
    if (user.roles.includes('ADMIN')) return true;
    throw new ForbiddenException();
  }

  update(model: unknown, user: User) {
    if (user.roles.includes('ADMIN')) return true;
    throw new ForbiddenException();
  }

  delete(model: unknown, user: User) {
    if (user.roles.includes('ADMIN')) return true;
    throw new ForbiddenException();
  }

  submit(model: unknown, user: User) {
    if (user.roles.includes('ADMIN')) return true;
    throw new ForbiddenException();
  }
}
