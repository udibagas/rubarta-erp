import { ForbiddenException } from '@nestjs/common';
import { PurchaseOrder, User } from '../prisma/client/client';
import { BasePolicy } from '../policy/base.policy';

export class PurchaseOrdersPolicy extends BasePolicy {
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

  view(model: PurchaseOrder, user: User) {
    if (user.roles.includes('ADMIN')) return true;
    if (!user.roles.includes('SALES_REP')) throw new ForbiddenException();
    if (model.userId === user.id) return true;
    throw new ForbiddenException();
  }

  update(model: PurchaseOrder, user: User) {
    return this.authorizeDraftMutation(model, user);
  }

  delete(model: PurchaseOrder, user: User) {
    return this.authorizeDraftMutation(model, user);
  }

  submit(model: PurchaseOrder, user: User) {
    return this.authorizeDraftMutation(model, user);
  }

  private authorizeDraftMutation(model: PurchaseOrder, user: User) {
    if (model.status !== 'Draft') throw new ForbiddenException();
    if (user.roles.includes('ADMIN')) return true;
    if (user.roles.includes('SALES_REP') && model.userId === user.id) {
      return true;
    }
    throw new ForbiddenException();
  }
}
