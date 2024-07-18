import { Injectable } from '@nestjs/common';
import { ApprovalSettingDto } from './dto/approval-setting.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApprovalSettingsService {
  constructor(private prisma: PrismaService) {}

  create(approvalSettingDto: ApprovalSettingDto) {
    const { items, ...data } = approvalSettingDto;
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

  findAll() {
    return this.prisma.approvalSetting.findMany({
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

  update(id: number, approvalSettingDto: ApprovalSettingDto) {
    const { items, ...data } = approvalSettingDto;

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
}
