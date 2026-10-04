import { Module } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { DepartmentsController } from './departments.controller';
import { DepartmentsResolver } from './departments.resolver';
import { DepartmentsPolicy } from './departments.policy';

@Module({
  controllers: [DepartmentsController],
  providers: [DepartmentsService, DepartmentsResolver, DepartmentsPolicy],
})
export class DepartmentsModule {}
