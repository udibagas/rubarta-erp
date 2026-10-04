import { Module } from '@nestjs/common';
import { BanksService } from './banks.service';
import { BanksController } from './banks.controller';
import { BanksResolver } from './banks.resolver';
import { BanksPolicy } from './banks.policy';

@Module({
  controllers: [BanksController],
  providers: [BanksService, BanksResolver, BanksPolicy],
})
export class BanksModule {}
