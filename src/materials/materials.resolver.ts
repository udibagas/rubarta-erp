import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { MaterialsService } from './materials.service';
import { MaterialType } from './dto/material.type';

@Resolver(() => MaterialType)
export class MaterialsResolver {
  constructor(private readonly materialsService: MaterialsService) {}

  @Query(() => [MaterialType], {
    name: 'materials',
    description: 'Get all materials',
  })
  async findAll(
    @Args('keyword', { nullable: true }) keyword?: string,
    @Args('category', { nullable: true }) category?: string,
    @Args('supplierId', { type: () => Int, nullable: true })
    supplierId?: number,
    @Args('isActive', { type: () => Boolean, nullable: true })
    isActive?: boolean,
    @Args('lowStock', { type: () => Boolean, nullable: true })
    lowStock?: boolean,
  ) {
    return this.materialsService.findAll({
      keyword,
      category,
      supplierId,
      isActive,
      lowStock,
    });
  }

  @Query(() => MaterialType, {
    name: 'material',
    description: 'Get material by ID',
  })
  async findOne(@Args('id', { type: () => Int }) id: number) {
    return this.materialsService.findOne(id);
  }
}
