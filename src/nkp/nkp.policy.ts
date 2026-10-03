import { ForbiddenException } from '@nestjs/common';
import { Nkp, User } from '../prisma/client/client';

export class NkpPolicy {
  viewAny(user?: User) {
    return true;
  }

  create(user?: User) {
    return true;
  }

  view(model: Nkp, user: User) {
    if (user.roles.includes('ADMIN')) return true;
    if (user.roles.includes('STAFF')) return true;
    if (user.id === model.requesterId) return true;
    if (user.id === model.employeeId) return true;
    throw new ForbiddenException();
  }

  update(model: Nkp, user: User) {
    if (model.status !== 'DRAFT') throw new ForbiddenException();
    if (user.roles.includes('ADMIN')) return true;
    if (user.roles.includes('STAFF')) return true;
    if (user.id === model.requesterId) return true;
    throw new ForbiddenException();
  }

  delete(model: Nkp, user: User) {
    if (model.status !== 'DRAFT') throw new ForbiddenException();
    if (user.roles.includes('ADMIN')) return true;
    if (user.roles.includes('STAFF')) return true;
    if (user.id === model.requesterId) return true;
    throw new ForbiddenException();
  }

  submit(model: Nkp, user: User) {
    if (model.status !== 'DRAFT') throw new ForbiddenException();
    if (user.roles.includes('ADMIN')) return true;
    if (user.roles.includes('STAFF')) return true;
    if (user.id === model.requesterId) return true;
    throw new ForbiddenException();
  }
}
