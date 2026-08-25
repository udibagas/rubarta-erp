import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { BanksService } from './banks.service';
import { BankType } from './bank.type';

@Resolver(() => BankType)
export class BanksResolver {
  constructor(private readonly banksService: BanksService) {}

  @Query(() => [BankType], { name: 'banks', description: 'Get all banks' })
  async findAll() {
    return this.banksService.findAll();
  }

  @Query(() => BankType, { name: 'bank', description: 'Get bank by ID' })
  async findOne(@Args('id', { type: () => Int }) id: number) {
    return this.banksService.findOne(id);
  }
}
