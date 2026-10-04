import { Module, Global } from '@nestjs/common';
import { ApprovalService } from './approval.service';
import { ApprovalController } from './approval.controller';
import { ApprovalPolicy } from './approval.policy';

@Global()
@Module({
  controllers: [ApprovalController],
  providers: [ApprovalService, ApprovalPolicy],
  exports: [ApprovalService],
})
export class ApprovalModule {}
