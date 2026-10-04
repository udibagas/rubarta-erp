import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { CustomersResolver } from './customers.resolver';
import { CustomersPolicy } from './customers.policy';

@Module({
  controllers: [CustomersController],
  providers: [CustomersService, CustomersResolver, CustomersPolicy],
})
export class CustomersModule {}
