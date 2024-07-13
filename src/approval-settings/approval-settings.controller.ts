import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { ApprovalSettingsService } from './approval-settings.service';
import { CreateApprovalSettingDto } from './dto/create-approval-setting.dto';
import { UpdateApprovalSettingDto } from './dto/update-approval-setting.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from 'src/auth/role.decorator';
import { Role } from '@prisma/client';
import { ApprovalSetting } from './entities/approval-setting.entity';

@ApiTags('Approval Setting')
@ApiBearerAuth()
@Controller('api/approval-settings')
export class ApprovalSettingsController {
  constructor(
    private readonly approvalSettingsService: ApprovalSettingsService,
  ) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiCreatedResponse({ type: ApprovalSetting })
  create(
    @Body() createApprovalSettingDto: CreateApprovalSettingDto,
  ): Promise<ApprovalSetting> {
    return this.approvalSettingsService.create(createApprovalSettingDto);
  }

  @Get()
  @ApiOkResponse({ type: ApprovalSetting, isArray: true })
  findAll(): Promise<ApprovalSetting[]> {
    return this.approvalSettingsService.findAll();
  }

  @Get(':id')
  @ApiOkResponse({ type: ApprovalSetting })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ApprovalSetting> {
    return this.approvalSettingsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOkResponse({ type: ApprovalSetting })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateApprovalSettingDto: UpdateApprovalSettingDto,
  ): Promise<ApprovalSetting> {
    return this.approvalSettingsService.update(id, updateApprovalSettingDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOkResponse({ type: ApprovalSetting })
  remove(@Param('id', ParseIntPipe) id: number): Promise<ApprovalSetting> {
    return this.approvalSettingsService.remove(id);
  }
}
