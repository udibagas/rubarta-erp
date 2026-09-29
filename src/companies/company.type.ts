import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType('BankType')
class BankType {
  @Field()
  name?: string;

  @Field({ nullable: true })
  branch?: string;

  @Field({ nullable: true })
  accountNumber?: string;

  @Field({ nullable: true })
  accountName?: string;

  @Field({ nullable: true })
  isPrimary?: boolean;
}

@ObjectType('Company')
export class CompanyType {
  @Field(() => Int)
  id: number;

  @Field()
  code: string;

  @Field()
  name: string;

  @Field()
  address: string;

  @Field()
  phone: string;

  @Field(() => [BankType])
  banks: BankType[];

  @Field()
  isDefault: boolean;
}
