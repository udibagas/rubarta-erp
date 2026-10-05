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
    action:
      'create' | 'viewAny' | 'view' | 'update' | 'delete' | 'submit' | string,
    model: unknown,
    user: User,
  ) {
    if (action === 'create') return this.create(user);
    if (action === 'viewAny') return this.viewAny(user);
    if (action === 'view') return this.view(model, user);
    if (action === 'update') return this.update(model, user);
    if (action === 'delete') return this.delete(model, user);
    if (action === 'submit') return this.submit(model, user);

    return (
      this[action]?.(model, user) ??
      (() => {
        throw new ForbiddenException();
      })()
    );
  }
}
