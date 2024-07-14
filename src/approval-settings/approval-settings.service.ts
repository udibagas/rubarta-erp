import { Injectable } from '@nestjs/common';
import { CreateApprovalSettingDto } from './dto/create-approval-setting.dto';
import { UpdateApprovalSettingDto } from './dto/update-approval-setting.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ApprovalSettingsService {
  constructor(private prisma: PrismaService) {}

  create(createApprovalSettingDto: CreateApprovalSettingDto) {
    const { approvalSettingItem, ...data } = createApprovalSettingDto;
    return this.prisma.approvalSetting.create({
      data: { ...data, ApprovalSettingItem: { create: approvalSettingItem } },
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

  update(id: number, updateApprovalSettingDto: UpdateApprovalSettingDto) {
    return this.prisma.approvalSetting.update({
      data: updateApprovalSettingDto,
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
