import { ForbiddenException } from '@nestjs/common';
import { Quotation, User } from '../prisma/client/client';
import { BasePolicy } from '../policy/base.policy';

export class QuotationsPolicy extends BasePolicy {
  protected viewAny(user: User) {
    if (user.roles.includes('ADMIN')) return true;
    if (user.roles.includes('SALES_REP')) return true;
    throw new ForbiddenException();
  }

  protected create(user: User) {
    if (user.roles.includes('ADMIN')) return true;
    if (user.roles.includes('SALES_REP')) return true;
    throw new ForbiddenException();
  }

  protected view(model: Quotation, user: User) {
    if (user.roles.includes('ADMIN')) return true;
    if (!user.roles.includes('SALES_REP')) throw new ForbiddenException();
    if (model.userId === user.id) return true;
    throw new ForbiddenException();
  }

  protected update(model: Quotation, user: User) {
    return this.authorizeDraftMutation(model, user);
  }

  protected delete(model: Quotation, user: User) {
    return this.authorizeDraftMutation(model, user);
  }

  protected submit(model: Quotation, user: User) {
    return this.authorizeDraftMutation(model, user);
  }

  private authorizeDraftMutation(model: Quotation, user: User) {
    if (model.status !== 'Draft') throw new ForbiddenException();
    if (user.roles.includes('ADMIN')) return true;
    if (user.roles.includes('SALES_REP') && model.userId === user.id) {
      return true;
    }
    throw new ForbiddenException();
  }
}
