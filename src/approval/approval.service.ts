import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ApprovalStatus, ApprovalType } from '../prisma/client/client';

@Injectable()
export class ApprovalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notification: NotificationsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create an approval workflow for a module based on the ApprovalSetting
   * configured for the given approvalType (and optionally companyId).
   * Notifies the first approver in the sequence.
   */
  async requestApproval(
    approvalType: ApprovalType,
    moduleId: number,
    companyId?: number,
  ) {
    const setting = await this.prisma.approvalSetting.findFirst({
      where: { approvalType, ...(companyId ? { companyId } : {}) },
      include: { ApprovalSettingItem: { orderBy: { level: 'asc' } } },
    });

    if (!setting || setting.ApprovalSettingItem.length === 0) {
      return null;
    }

    const approval = await this.prisma.approval.create({
      data: {
        approvalType,
        moduleId,
        items: {
          create: setting.ApprovalSettingItem.map((item) => ({
            userId: item.userId,
            order: item.level,
          })),
        },
      },
      include: {
        items: { include: { user: true }, orderBy: { order: 'asc' } },
      },
    });

    const module = await this.getModule(approvalType, moduleId);
    const redirectUrl = this.getRedirectUrl(approvalType, moduleId);
    const firstApprover = approval.items[0];

    if (firstApprover) {
      this.notification.notify({
        userId: firstApprover.userId,
        title: `Permintaan Persetujuan ${approvalType}`,
        message: `Anda memiliki permintaan persetujuan baru untuk ${approvalType} #${module.number ?? moduleId}`,
        redirectUrl,
      });
    }

    this.eventEmitter.emit('approval.requested', {
      approvalType,
      moduleId,
      approval,
    });

    return approval;
  }

  findByModule(approvalType: ApprovalType, moduleId: number) {
    return this.prisma.approval.findFirst({
      where: { approvalType, moduleId },
      include: {
        items: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  /**
   * List approvals currently awaiting action from the given user,
   * respecting the sequential order of approvers.
   */
  async findPendingForUser(userId: number, approvalType?: ApprovalType) {
    const approvals = await this.prisma.approval.findMany({
      where: {
        status: null,
        approvalType,
        items: { some: { userId, status: null } },
      },
      include: {
        items: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const pendingApprovals = approvals.filter((approval) => {
      const currentItem = approval.items.find((item) => !item.status);
      return currentItem?.userId === userId;
    });

    const documentNumbers = new Map<string, string | null>();
    const approvalTypes = [
      ...new Set(pendingApprovals.map((approval) => approval.approvalType)),
    ];

    await Promise.all(
      approvalTypes.map(async (type) => {
        const moduleIds = [
          ...new Set(
            pendingApprovals
              .filter((approval) => approval.approvalType === type)
              .map((approval) => approval.moduleId),
          ),
        ];

        let documents: { id: number; number: string | null }[] = [];

        switch (type) {
          case ApprovalType.NKP:
            documents = await this.prisma.nkp.findMany({
              where: { id: { in: moduleIds } },
              select: { id: true, number: true },
            });
            break;
          case ApprovalType.QUOTATION:
            documents = await this.prisma.quotation.findMany({
              where: { id: { in: moduleIds } },
              select: { id: true, number: true },
            });
            break;
          case ApprovalType.SALES_ORDER:
            documents = await this.prisma.salesOrder.findMany({
              where: { id: { in: moduleIds } },
              select: { id: true, number: true },
            });
            break;
          case ApprovalType.PURCHASE_ORDER:
            documents = await this.prisma.purchaseOrder.findMany({
              where: { id: { in: moduleIds } },
              select: { id: true, number: true },
            });
            break;
          case ApprovalType.INVOICE:
            documents = await this.prisma.invoice.findMany({
              where: { id: { in: moduleIds } },
              select: { id: true, number: true },
            });
            break;
        }

        for (const document of documents) {
          documentNumbers.set(`${type}:${document.id}`, document.number);
        }
      }),
    );

    const genericPendingApprovals = pendingApprovals.map((approval) => ({
      ...approval,
      documentNumber:
        documentNumbers.get(`${approval.approvalType}:${approval.moduleId}`) ??
        null,
    }));

    const nkpApprovals =
      !approvalType || approvalType === ApprovalType.NKP
        ? await this.prisma.nkpApproval.findMany({
            where: { userId, approvalStatus: null },
            include: {
              Nkp: {
                select: {
                  id: true,
                  number: true,
                  createdAt: true,
                  updatedAt: true,
                  NkpApproval: {
                    orderBy: { level: 'asc' },
                    include: {
                      User: { select: { id: true, name: true, email: true } },
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          })
        : [];

    const nkpPendingApprovals = nkpApprovals.map(({ Nkp }) => ({
      id: Nkp.id,
      approvalType: ApprovalType.NKP,
      moduleId: Nkp.id,
      status: null,
      createdAt: Nkp.createdAt,
      updatedAt: Nkp.updatedAt,
      documentNumber: Nkp.number,
      items: Nkp.NkpApproval.map((item) => ({
        id: item.id,
        approvalId: Nkp.id,
        order: item.level,
        userId: item.userId,
        status: item.approvalStatus,
        remarks: item.note,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        approvalActionType: item.approvalActionType,
        user: item.User,
      })),
    }));

    return [...genericPendingApprovals, ...nkpPendingApprovals];
  }

  async approve(
    approvalType: ApprovalType,
    moduleId: number,
    userId: number,
    remarks?: string,
  ) {
    const { approval, currentItem } = await this.getActionableItem(
      approvalType,
      moduleId,
      userId,
    );

    await this.prisma.approvalItem.update({
      where: { id: currentItem.id },
      data: { status: ApprovalStatus.APPROVED, remarks },
    });

    const remainingItems = approval.items.filter(
      (item) => !item.status && item.id !== currentItem.id,
    );
    const isFullyApproved = remainingItems.length === 0;

    const updatedApproval = await this.prisma.approval.update({
      where: { id: approval.id },
      data: {
        status: isFullyApproved
          ? ApprovalStatus.APPROVED
          : ApprovalStatus.PARTIALLY_APPROVED,
      },
      include: {
        items: { include: { user: true }, orderBy: { order: 'asc' } },
      },
    });

    if (isFullyApproved) {
      this.eventEmitter.emit('approval.completed', { approvalType, moduleId });
    } else {
      const nextApprover = remainingItems[0];
      const module = await this.getModule(approvalType, moduleId);
      const redirectUrl = this.getRedirectUrl(approvalType, moduleId);

      this.notification.notify({
        userId: nextApprover.userId,
        title: `Permintaan Persetujuan ${approvalType}`,
        message: `Anda memiliki permintaan persetujuan baru untuk ${approvalType} #${module.number ?? moduleId}`,
        redirectUrl,
      });

      this.eventEmitter.emit('approval.nextApprover', {
        approvalType,
        moduleId,
        userId: nextApprover.userId,
      });
    }

    this.eventEmitter.emit('approval.itemApproved', {
      approvalType,
      moduleId,
      userId,
    });

    return updatedApproval;
  }

  async reject(
    approvalType: ApprovalType,
    moduleId: number,
    userId: number,
    remarks?: string,
  ) {
    const { approval, currentItem } = await this.getActionableItem(
      approvalType,
      moduleId,
      userId,
    );

    await this.prisma.approvalItem.update({
      where: { id: currentItem.id },
      data: { status: ApprovalStatus.REJECTED, remarks },
    });

    const updatedApproval = await this.prisma.approval.update({
      where: { id: approval.id },
      data: { status: ApprovalStatus.REJECTED },
      include: {
        items: { include: { user: true }, orderBy: { order: 'asc' } },
      },
    });

    this.eventEmitter.emit('approval.rejected', {
      approvalType,
      moduleId,
      userId,
      remarks,
    });

    return updatedApproval;
  }

  private async getActionableItem(
    approvalType: ApprovalType,
    moduleId: number,
    userId: number,
  ) {
    const approval = await this.prisma.approval.findFirst({
      where: { approvalType, moduleId },
      include: { items: { orderBy: { order: 'asc' } } },
    });

    if (!approval) {
      throw new NotFoundException('Approval not found');
    }

    if (
      approval.status == ApprovalStatus.APPROVED ||
      approval.status == ApprovalStatus.REJECTED
    ) {
      throw new BadRequestException('This approval has already been finalized');
    }

    const currentItem = approval.items.find((item) => !item.status);

    if (!currentItem || currentItem.userId !== userId) {
      throw new ForbiddenException(
        'You are not allowed to perform this action',
      );
    }

    return { approval, currentItem };
  }

  private async getModule(approvalType: ApprovalType, moduleId: number) {
    switch (approvalType) {
      case ApprovalType.QUOTATION:
        return this.prisma.quotation.findUnique({ where: { id: moduleId } });
      case ApprovalType.PURCHASE_ORDER:
        return this.prisma.purchaseOrder.findUnique({
          where: { id: moduleId },
        });
      default:
        throw new NotFoundException(
          'Module not found for the given approval type',
        );
    }
  }

  private getRedirectUrl(approvalType: ApprovalType, moduleId: number) {
    const baseUrl = 'https://erp.rubarta.co.id';

    switch (approvalType) {
      case ApprovalType.QUOTATION:
        return `${baseUrl}/sales/quotations/${moduleId}`;
      case ApprovalType.PURCHASE_ORDER:
        return `${baseUrl}/purchasing-logistics/purchase-orders/${moduleId}`;
      default:
        return null;
    }
  }
}
