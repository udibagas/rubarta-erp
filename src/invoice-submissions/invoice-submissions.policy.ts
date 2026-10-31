import { ForbiddenException } from '@nestjs/common';
import { InvoiceSubmission, User } from '../prisma/client/client';
import { BasePolicy } from '../policy/base.policy';

export class InvoiceSubmissionsPolicy extends BasePolicy {
  viewAny(user: User) {
    if (user.roles.includes('ADMIN') || user.roles.includes('SALES_REP')) {
      return true;
    }
    throw new ForbiddenException();
  }

  create(user: User) {
    if (user.roles.includes('ADMIN') || user.roles.includes('SALES_REP')) {
      return true;
    }
    throw new ForbiddenException();
  }

  view(submission: InvoiceSubmission, user: User) {
    if (user.roles.includes('ADMIN')) return true;
    if (user.roles.includes('SALES_REP') && submission.userId === user.id) {
      return true;
    }
    throw new ForbiddenException();
  }

  update(submission: InvoiceSubmission, user: User) {
    this.authorizeOwnerOrAdmin(submission, user);
    if (submission.status !== 'Draft') {
      throw new ForbiddenException('Only draft submissions can be updated');
    }
    return true;
  }

  delete(submission: InvoiceSubmission, user: User) {
    this.authorizeOwnerOrAdmin(submission, user);
    if (submission.status !== 'Draft') {
      throw new ForbiddenException('Only draft submissions can be deleted');
    }
    return true;
  }

  status(submission: InvoiceSubmission, user: User) {
    return this.authorizeOwnerOrAdmin(submission, user);
  }

  private authorizeOwnerOrAdmin(submission: InvoiceSubmission, user: User) {
    if (user.roles.includes('ADMIN')) return true;
    if (user.roles.includes('SALES_REP') && submission.userId === user.id) {
      return true;
    }
    throw new ForbiddenException();
  }
}
