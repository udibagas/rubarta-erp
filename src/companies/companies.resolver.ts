import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { CompaniesService } from './companies.service';
import { CompanyType } from './company.type';

@Resolver(() => CompanyType)
export class CompaniesResolver {
  constructor(private readonly companiesService: CompaniesService) {}

  @Query(() => [CompanyType], {
    name: 'companies',
    description: 'Get all companies',
  })
  async findAll() {
    return this.companiesService.findAll();
  }

  @Query(() => CompanyType, {
    name: 'company',
    description: 'Get company by ID',
  })
  async findOne(@Args('id', { type: () => Int }) id: number) {
    return this.companiesService.findOne(id);
  }
}
