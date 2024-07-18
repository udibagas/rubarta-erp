import { Injectable } from '@nestjs/common';
import { ApprovalSettingDto } from './dto/approval-setting.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApprovalSettingsService {
  constructor(private prisma: PrismaService) {}

  create(approvalSettingDto: ApprovalSettingDto) {
    const { items, ...data } = approvalSettingDto;
    return this.prisma.approvalSetting.create({
      data: { ...data, ApprovalSettingItem: { create: items } },
      include: {
        ApprovalSettingItem: true,
      },
    });
  }

  findAll() {
    return this.prisma.approvalSetting.findMany({
      include: {
        ApprovalSettingItem: true,
      },
    });
  }

  findOne(id: number) {
    return this.prisma.approvalSetting.findUniqueOrThrow({
      where: { id },
      include: {
        ApprovalSettingItem: true,
      },
    });
  }

  update(id: number, approvalSettingDto: ApprovalSettingDto) {
    return this.prisma.approvalSetting.update({
      data: approvalSettingDto,
      where: { id },
      include: {
        ApprovalSettingItem: true,
      },
    });
  }

  remove(id: number) {
    return this.prisma.approvalSetting.delete({ where: { id } });
  }
}
