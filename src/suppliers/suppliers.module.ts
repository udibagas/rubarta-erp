import { Module } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { SuppliersController } from './suppliers.controller';
import { SuppliersResolver } from './suppliers.resolver';

@Module({
  controllers: [SuppliersController],
  providers: [SuppliersService, SuppliersResolver],
})
export class SuppliersModule {}
