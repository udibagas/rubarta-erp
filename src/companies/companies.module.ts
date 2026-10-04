import { Module } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { CompaniesResolver } from './companies.resolver';
import { CompaniesPolicy } from './companies.policy';

@Module({
  controllers: [CompaniesController],
  providers: [CompaniesService, CompaniesResolver, CompaniesPolicy],
})
export class CompaniesModule {}
