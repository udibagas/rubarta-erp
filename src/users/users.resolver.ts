import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { UserType } from './user.type';

@Resolver(() => UserType)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => [UserType], { name: 'users', description: 'Get all users' })
  async findAll(@Args('keyword', { nullable: true }) keyword?: string) {
    return this.usersService.findAll(keyword);
  }

  @Query(() => UserType, { name: 'user', description: 'Get user by ID' })
  async findOne(@Args('id', { type: () => Int }) id: number) {
    return this.usersService.findOne(id);
  }
}
