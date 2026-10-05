import { ForbiddenException } from '@nestjs/common';
import { Nkp, User } from '../prisma/client/client';
import { BasePolicy } from '../policy/base.policy';

export class NkpPolicy extends BasePolicy {
  protected viewAny(user?: User) {
    return true;
  }

  protected create(user?: User) {
    return true;
  }

  protected view(model: Nkp, user: User) {
    if (user.roles.includes('ADMIN')) return true;
    if (user.roles.includes('STAFF')) return true;
    if (user.id === model.requesterId) return true;
    if (user.id === model.employeeId) return true;
    throw new ForbiddenException();
  }

  protected update(model: Nkp, user: User) {
    return this.authorizeDraftMutation(model, user);
  }

  protected delete(model: Nkp, user: User) {
    if (!['DRAFT', 'SUBMITTED'].includes(model.status))
      throw new ForbiddenException();
    if (
      user.roles.includes('ADMIN') ||
      user.roles.includes('STAFF') ||
      user.id === model.requesterId
    ) {
      return true;
    }
    throw new ForbiddenException();
  }

  protected submit(model: Nkp, user: User) {
    return this.authorizeDraftMutation(model, user);
  }

  protected close(model: Nkp, user: User) {
    if (user.roles.includes('ADMIN')) return true;
    throw new ForbiddenException();
  }

  private authorizeDraftMutation(model: Nkp, user: User) {
    if (model.status !== 'DRAFT') throw new ForbiddenException();
    if (
      user.roles.includes('ADMIN') ||
      user.roles.includes('STAFF') ||
      user.id === model.requesterId
    ) {
      return true;
    }
    throw new ForbiddenException();
  }
}
