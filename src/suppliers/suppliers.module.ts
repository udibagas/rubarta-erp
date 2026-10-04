import { Module } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { SuppliersController } from './suppliers.controller';
import { SuppliersResolver } from './suppliers.resolver';
import { SuppliersPolicy } from './suppliers.policy';

@Module({
  controllers: [SuppliersController],
  providers: [SuppliersService, SuppliersResolver, SuppliersPolicy],
})
export class SuppliersModule {}
