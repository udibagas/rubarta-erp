import { Module } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { DepartmentsController } from './departments.controller';
import { DepartmentsResolver } from './departments.resolver';

@Module({
  controllers: [DepartmentsController],
  providers: [DepartmentsService, DepartmentsResolver],
})
export class DepartmentsModule {}
