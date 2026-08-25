import { Module } from '@nestjs/common';
import { BanksService } from './banks.service';
import { BanksController } from './banks.controller';
import { BanksResolver } from './banks.resolver';

@Module({
  controllers: [BanksController],
  providers: [BanksService, BanksResolver],
})
export class BanksModule {}
