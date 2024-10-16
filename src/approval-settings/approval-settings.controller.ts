import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApprovalSettingsService } from './approval-settings.service';
import { ApprovalSettingDto } from './approval-setting.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/role.decorator';
import { ApprovalType, Role } from '@prisma/client';
import { ApprovalSetting } from './approval-setting.entity';

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
  @ApiCreatedResponse({
    type: ApprovalSetting,
    description: 'Created approval setting',
    example: {
      companyId: 1,
      approvalType: ApprovalType.NKP,
      items: [
        {
          userId: 1,
          level: 1,
          approvalActionType: 'APPROVAL',
        },
      ],
    },
  })
  create(
    @Body() approvalSettingDto: ApprovalSettingDto,
  ): Promise<ApprovalSetting> {
    return this.approvalSettingsService.create(approvalSettingDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all approval settings' })
  @ApiOkResponse({ type: ApprovalSetting, isArray: true })
  findAll(
    @Query('companyId', ParseIntPipe) companyId: number,
  ): Promise<ApprovalSetting[]> {
    return this.approvalSettingsService.findAll(companyId);
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
    @Body() approvalSettingDto: ApprovalSettingDto,
  ): Promise<ApprovalSetting> {
    return this.approvalSettingsService.update(id, approvalSettingDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete approval setting by id' })
  @ApiOkResponse({ type: ApprovalSetting })
  remove(@Param('id', ParseIntPipe) id: number): Promise<ApprovalSetting> {
    return this.approvalSettingsService.remove(id);
  }

  @Delete(':id/:itemId')
  removeItem(@Param('itemId', ParseIntPipe) itemId: number) {
    return this.approvalSettingsService.removeItem(itemId);
  }
}
