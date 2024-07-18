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
import { ApprovalSettingDto } from './dto/approval-setting.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/role.decorator';
import { ApprovalType, Role } from '@prisma/client';
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
  @ApiCreatedResponse({
    type: ApprovalSetting,
    description: 'Created approval setting',
    example: {
      companyId: 1,
      approvalType: ApprovalType.PAYMENT_AUTHORIZATION,
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
}
