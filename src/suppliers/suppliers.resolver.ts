import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { SuppliersService } from './suppliers.service';
import { SupplierType } from './supplier.type';

@Resolver(() => SupplierType)
export class SuppliersResolver {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Query(() => [SupplierType], {
    name: 'suppliers',
    description: 'Get all suppliers',
  })
  async findAll(@Args('keyword', { nullable: true }) keyword?: string) {
    return this.suppliersService.findAll({ keyword });
  }

  @Query(() => SupplierType, {
    name: 'supplier',
    description: 'Get supplier by ID',
  })
  async findOne(@Args('id', { type: () => Int }) id: number) {
    return this.suppliersService.findOne(id);
  }
}
