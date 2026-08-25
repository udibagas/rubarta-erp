import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType('Company')
export class CompanyType {
  @Field(() => Int)
  id: number;

  @Field()
  code: string;

  @Field()
  name: string;

  @Field()
  isDefault: boolean;
}
