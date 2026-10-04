import { Module } from '@nestjs/common';
import { OpportunitiesService } from './opportunities.service';
import { OpportunitiesController } from './opportunities.controller';
import { OpportunitiesPolicy } from './opportunities.policy';

@Module({
  controllers: [OpportunitiesController],
  providers: [OpportunitiesService, OpportunitiesPolicy],
  exports: [OpportunitiesService],
})
export class OpportunitiesModule {}
