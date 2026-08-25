import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { DepartmentsService } from './departments.service';
import { DepartmentType } from './department.type';

@Resolver(() => DepartmentType)
export class DepartmentsResolver {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Query(() => [DepartmentType], {
    name: 'departments',
    description: 'Get all departments',
  })
  async findAll() {
    return this.departmentsService.findAll();
  }

  @Query(() => DepartmentType, {
    name: 'department',
    description: 'Get department by ID',
  })
  async findOne(@Args('id', { type: () => Int }) id: number) {
    return this.departmentsService.findOne(id);
  }
}
