import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { CustomersService } from './customers.service';
import { CustomerType } from './customer.type';

@Resolver(() => CustomerType)
export class CustomersResolver {
  constructor(private readonly customersService: CustomersService) {}

  @Query(() => [CustomerType], {
    name: 'customers',
    description: 'Get all customers',
  })
  async findAll(
    @Args('keyword', { nullable: true }) keyword?: string,
    @Args('industry', { nullable: true }) industry?: string,
    @Args('isActive', { type: () => Boolean, nullable: true })
    isActive?: boolean,
    @Args('accountManagerId', { type: () => Int, nullable: true })
    accountManagerId?: number,
  ) {
    return this.customersService.findAll({
      keyword,
      industry,
      isActive,
      accountManagerId,
    });
  }

  @Query(() => CustomerType, {
    name: 'customer',
    description: 'Get customer by ID',
  })
  async findOne(@Args('id', { type: () => Int }) id: number) {
    return this.customersService.findOne(id);
  }
}
