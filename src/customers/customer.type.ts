import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType('Customer')
export class CustomerType {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field()
  address: string;

  @Field()
  phone: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  website?: string;

  @Field({ nullable: true })
  industry?: string;

  @Field(() => Int, { nullable: true })
  employeeCount?: number;

  @Field(() => Float, { nullable: true })
  revenue?: number;

  @Field(() => [String])
  tags: string[];

  @Field(() => Int, { nullable: true })
  accountManagerId?: number;

  @Field()
  isActive: boolean;

  @Field({ nullable: true })
  createdAt?: Date;

  @Field({ nullable: true })
  updatedAt?: Date;
}
