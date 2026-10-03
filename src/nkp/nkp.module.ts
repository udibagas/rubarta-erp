import { Module } from '@nestjs/common';
import { NkpService } from './nkp.service';
import { NkpController } from './nkp.controller';
import { NkpPolicy } from './nkp.policy';

@Module({
  controllers: [NkpController],
  providers: [NkpService, NkpPolicy],
})
export class NkpModule {}
