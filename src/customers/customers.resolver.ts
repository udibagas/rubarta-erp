import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { CustomersService } from './customers.service';
import { CustomerType } from './customer.type';
import { PrismaService } from '../prisma/prisma.service';

@Resolver(() => CustomerType)
export class CustomersResolver {
  constructor(
    private readonly customersService: CustomersService,
    private readonly prisma: PrismaService,
  ) {}

  @Query(() => [CustomerType], {
    name: 'customers',
    description: 'Get all customers',
  })
  async findAll(
    @Args('isActive', { type: () => Boolean, nullable: true })
    isActive?: boolean,
    @Args('accountManagerId', { type: () => Int, nullable: true })
    accountManagerId?: number,
  ) {
    return this.prisma.customer.findMany({
      where: {
        ...(isActive !== undefined && { isActive }),
        ...(accountManagerId && { accountManagerId }),
      },
      orderBy: { name: 'asc' },
      include: {
        accountManager: {
          select: { name: true },
        },
        Contacts: {
          select: { name: true, phone: true, email: true },
        },
      },
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
