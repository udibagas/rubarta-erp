import { User } from '../prisma/client/client';
import { ForbiddenException } from '@nestjs/common';

export class BasePolicy {
  protected viewAny(user: User) {
    return true;
  }

  protected create(user: User) {
    return true;
  }

  protected view(model: unknown, user: User) {
    return true;
  }

  protected update(model: unknown, user: User) {
    return true;
  }

  protected delete(model: unknown, user: User) {
    return true;
  }

  protected submit(model: unknown, user: User) {
    return true;
  }

  can(
    action: 'create' | 'viewAny' | 'view' | 'update' | 'delete' | 'submit',
    model: unknown,
    user: User,
  ) {
    switch (action) {
      case 'create':
        return this.create(user);
      case 'viewAny':
        return this.viewAny(user);
      case 'view':
        return this.view(model, user);
      case 'update':
        return this.update(model, user);
      case 'delete':
        return this.delete(model, user);
      case 'submit':
        return this.submit(model, user);

      default:
        throw new ForbiddenException();
    }
  }
}
