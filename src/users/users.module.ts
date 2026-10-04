import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersResolver } from './users.resolver';
import { UsersPolicy } from './users.policy';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersResolver, UsersPolicy],
  exports: [UsersService],
})
export class UsersModule {}
