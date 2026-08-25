import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType('Bank')
export class BankType {
  @Field(() => Int)
  id: number;

  @Field()
  code: string;

  @Field()
  name: string;
}
