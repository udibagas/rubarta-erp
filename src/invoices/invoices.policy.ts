import { ForbiddenException } from '@nestjs/common';
import { Invoice, User } from '../prisma/client/client';

export class InvoicesPolicy {
  viewAny(user: User) {
    if (user.roles.includes('ADMIN')) return true;
    if (user.roles.includes('SALES_REP')) return true;
    throw new ForbiddenException();
  }

  create(user: User) {
    if (user.roles.includes('ADMIN')) return true;
    if (user.roles.includes('SALES_REP')) return true;
    throw new ForbiddenException();
  }

  view(model: Invoice, user: User) {
    if (user.roles.includes('ADMIN')) return true;
    if (!user.roles.includes('SALES_REP')) throw new ForbiddenException();
    if (model.userId === user.id) return true;
    throw new ForbiddenException();
  }

  update(model: Invoice, user: User) {
    return this.authorizeDraftMutation(model, user);
  }

  delete(model: Invoice, user: User) {
    return this.authorizeDraftMutation(model, user);
  }

  submit(model: Invoice, user: User) {
    return this.authorizeDraftMutation(model, user);
  }

  private authorizeDraftMutation(model: Invoice, user: User) {
    if (model.status !== 'Draft') throw new ForbiddenException();
    if (user.roles.includes('ADMIN')) return true;
    if (user.roles.includes('SALES_REP') && model.userId === user.id) {
      return true;
    }
    throw new ForbiddenException();
  }
}
