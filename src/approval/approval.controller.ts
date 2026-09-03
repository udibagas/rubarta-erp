import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApprovalService } from './approval.service';
import { ApprovalActionDto } from './approval.dto';
import { Approval } from './approval.entity';
import { Auth } from '../auth/auth.decorator';
import { ApprovalType, User } from '../prisma/client/client';

@ApiTags('Approval')
@ApiBearerAuth()
@Controller('api/approvals')
export class ApprovalController {
  constructor(private readonly approvalService: ApprovalService) {}

  @Get()
  @ApiOperation({ summary: 'Get pending approvals for the logged in user' })
  @ApiOkResponse({ type: Approval, isArray: true })
  findPending(
    @Auth() user: User,
    @Query('approvalType') approvalType?: ApprovalType,
  ): Promise<Approval[]> {
    return this.approvalService.findPendingForUser(user.id, approvalType);
  }

  @Get(':approvalType/:moduleId')
  @ApiOperation({ summary: 'Get the approval status of a module' })
  @ApiOkResponse({ type: Approval })
  findByModule(
    @Param('approvalType') approvalType: ApprovalType,
    @Param('moduleId', ParseIntPipe) moduleId: number,
  ): Promise<Approval> {
    return this.approvalService.findByModule(approvalType, moduleId);
  }

  @Post(':approvalType/:moduleId/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a module for the current approver' })
  @ApiOkResponse({ type: Approval })
  approve(
    @Param('approvalType') approvalType: ApprovalType,
    @Param('moduleId', ParseIntPipe) moduleId: number,
    @Auth() user: User,
    @Body() dto: ApprovalActionDto,
  ): Promise<Approval> {
    return this.approvalService.approve(
      approvalType,
      moduleId,
      user.id,
      dto.remarks,
    );
  }

  @Post(':approvalType/:moduleId/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a module for the current approver' })
  @ApiOkResponse({ type: Approval })
  reject(
    @Param('approvalType') approvalType: ApprovalType,
    @Param('moduleId', ParseIntPipe) moduleId: number,
    @Auth() user: User,
    @Body() dto: ApprovalActionDto,
  ): Promise<Approval> {
    return this.approvalService.reject(
      approvalType,
      moduleId,
      user.id,
      dto.remarks,
    );
  }
}
