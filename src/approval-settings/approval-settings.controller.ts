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
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/role.decorator';
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
  @ApiOperation({ summary: 'Create new approval setting' })
  @ApiCreatedResponse({ type: ApprovalSetting })
  create(
    @Body() createApprovalSettingDto: CreateApprovalSettingDto,
  ): Promise<ApprovalSetting> {
    return this.approvalSettingsService.create(createApprovalSettingDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all approval settings' })
  @ApiOkResponse({ type: ApprovalSetting, isArray: true })
  findAll(): Promise<ApprovalSetting[]> {
    return this.approvalSettingsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single approval setting by id' })
  @ApiOkResponse({ type: ApprovalSetting })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ApprovalSetting> {
    return this.approvalSettingsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update approval setting by id' })
  @ApiOkResponse({ type: ApprovalSetting })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateApprovalSettingDto: UpdateApprovalSettingDto,
  ): Promise<ApprovalSetting> {
    return this.approvalSettingsService.update(id, updateApprovalSettingDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete approval setting by id' })
  @ApiOkResponse({ type: ApprovalSetting })
  remove(@Param('id', ParseIntPipe) id: number): Promise<ApprovalSetting> {
    return this.approvalSettingsService.remove(id);
  }
}
