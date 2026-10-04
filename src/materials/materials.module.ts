import { Module } from '@nestjs/common';
import { MaterialsService } from './materials.service';
import { MaterialsController } from './materials.controller';
import { MaterialsResolver } from './materials.resolver';
import { PrismaModule } from '../prisma/prisma.module';
import { MaterialsPolicy } from './materials.policy';

@Module({
  imports: [PrismaModule],
  controllers: [MaterialsController],
  providers: [MaterialsService, MaterialsResolver, MaterialsPolicy],
  exports: [MaterialsService],
})
export class MaterialsModule {}
