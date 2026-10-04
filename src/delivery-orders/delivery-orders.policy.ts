import { ForbiddenException } from '@nestjs/common';
import { DeliveryOrder, User } from '../prisma/client/client';

export class DeliveryOrdersPolicy {
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

  view(model: DeliveryOrder, user: User) {
    if (user.roles.includes('ADMIN')) return true;
    if (!user.roles.includes('SALES_REP')) throw new ForbiddenException();
    if (model.userId === user.id) return true;
    throw new ForbiddenException();
  }

  update(model: DeliveryOrder, user: User) {
    return this.authorizeDraftMutation(model, user);
  }

  delete(model: DeliveryOrder, user: User) {
    return this.authorizeDraftMutation(model, user);
  }

  submit(model: DeliveryOrder, user: User) {
    return this.authorizeDraftMutation(model, user);
  }

  private authorizeDraftMutation(model: DeliveryOrder, user: User) {
    if (model.status !== 'Draft') throw new ForbiddenException();
    if (user.roles.includes('ADMIN')) return true;
    if (user.roles.includes('SALES_REP') && model.userId === user.id) {
      return true;
    }
    throw new ForbiddenException();
  }
}
