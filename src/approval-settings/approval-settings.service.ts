import { Injectable, NotFoundException } from '@nestjs/common';
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

  async findOne(id: number) {
    const data = await this.prisma.approvalSetting.findUnique({
      where: { id },
      include: {
        ApprovalSettingItem: true,
      },
    });
    if (!data) throw new NotFoundException();
    return data;
  }

  async update(id: number, updateApprovalSettingDto: UpdateApprovalSettingDto) {
    await this.findOne(id);
    return this.prisma.approvalSetting.update({
      data: updateApprovalSettingDto,
      where: { id },
      include: {
        ApprovalSettingItem: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.approvalSetting.delete({ where: { id } });
  }
}
