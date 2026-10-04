import { User } from '../prisma/client/client';

export class AllowAllPolicy {
  viewAny(user?: User) {
    return true;
  }

  create(user?: User) {
    return true;
  }

  view(model: unknown, user: User) {
    return true;
  }

  update(model: unknown, user: User) {
    return true;
  }

  delete(model: unknown, user: User) {
    return true;
  }

  submit(model: unknown, user: User) {
    return true;
  }
}
