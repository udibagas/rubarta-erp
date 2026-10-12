import { Resolver, Query, Args } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { UserType } from './user.type';

@Resolver(() => UserType)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => [UserType], { name: 'users', description: 'Get all users' })
  async findAll(
    @Args('keyword', { nullable: true }) keyword?: string,
    @Args('active', { type: () => Boolean, nullable: true }) active?: boolean,
  ) {
    return this.usersService.findAll({ keyword, active });
  }
}
