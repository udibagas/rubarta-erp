import { Injectable } from '@nestjs/common';
import { ApprovalSettingDto } from './approval-setting.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApprovalSettingsService {
  constructor(private prisma: PrismaService) {}

  create(approvalSettingDto: ApprovalSettingDto) {
    const { ApprovalSettingItem: items, ...data } = approvalSettingDto;
    return this.prisma.approvalSetting.create({
      data: {
        ...data,
        ApprovalSettingItem: {
          create: items,
        },
      },
      include: {
        Company: true,
        ApprovalSettingItem: {
          include: { User: true },
        },
      },
    });
  }

  findAll(companyId: number) {
    return this.prisma.approvalSetting.findMany({
      where: { companyId },
      orderBy: [
        { approvalType: 'asc' },
        { paymentType: 'asc' },
        { nkpType: 'asc' },
      ],
      include: {
        Company: true,
        ApprovalSettingItem: {
          include: { User: true },
        },
      },
    });
  }

  findOne(id: number) {
    return this.prisma.approvalSetting.findUniqueOrThrow({
      where: { id },
      include: {
        Company: true,
        ApprovalSettingItem: {
          include: { User: true },
        },
      },
    });
  }

  update(id: number, dto: ApprovalSettingDto) {
    console.log(dto);
    const { ApprovalSettingItem: items, ...data } = dto;

    return this.prisma.approvalSetting.update({
      data: {
        ...data,
        ApprovalSettingItem: {
          deleteMany: {},
          create: items,
        },
      },
      where: { id },
      include: {
        Company: true,
        ApprovalSettingItem: {
          include: { User: true },
        },
      },
    });
  }

  remove(id: number) {
    return this.prisma.approvalSetting.delete({ where: { id } });
  }

  removeItem(id: number) {
    return this.prisma.approvalSettingItem.delete({
      where: { id },
    });
  }
}
