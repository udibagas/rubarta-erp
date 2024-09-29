import { Module } from '@nestjs/common';
import { NkpService } from './nkp.service';
import { NkpController } from './nkp.controller';

@Module({
  controllers: [NkpController],
  providers: [NkpService],
})
export class NkpModule {}
