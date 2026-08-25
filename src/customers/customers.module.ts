import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { CustomersResolver } from './customers.resolver';

@Module({
  controllers: [CustomersController],
  providers: [CustomersService, CustomersResolver],
})
export class CustomersModule {}
