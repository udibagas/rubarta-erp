import { Module } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { OpportunitiesModule } from '../opportunities/opportunities.module';
import { LeadsPolicy } from './leads.policy';

@Module({
  imports: [OpportunitiesModule],
  controllers: [LeadsController],
  providers: [LeadsService, LeadsPolicy],
})
export class LeadsModule {}
