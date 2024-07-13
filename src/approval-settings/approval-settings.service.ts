import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateApprovalSettingDto } from './dto/create-approval-setting.dto';
import { UpdateApprovalSettingDto } from './dto/update-approval-setting.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ApprovalSettingsService {
  constructor(private prisma: PrismaService) {}

  create(createApprovalSettingDto: CreateApprovalSettingDto) {
    return this.prisma.approvalSetting.create({
      data: createApprovalSettingDto,
    });
  }

  findAll() {
    return this.prisma.approvalSetting.findMany();
  }

  async findOne(id: number) {
    const data = await this.prisma.approvalSetting.findUnique({
      where: { id },
    });
    if (!data) throw new NotFoundException();
    return data;
  }

  async update(id: number, updateApprovalSettingDto: UpdateApprovalSettingDto) {
    await this.findOne(id);
    return this.prisma.approvalSetting.update({
      data: updateApprovalSettingDto,
      where: { id },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.approvalSetting.delete({ where: { id } });
  }
}
