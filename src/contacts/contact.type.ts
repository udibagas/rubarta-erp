import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType('Contact')
export class ContactType {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  customerId: number;

  @Field()
  name: string;

  @Field({ nullable: true })
  email?: string;

  @Field()
  phone: string;

  @Field({ nullable: true })
  position?: string;

  @Field({ nullable: true })
  notes?: string;

  @Field()
  isPrimary: boolean;

  @Field()
  isActive: boolean;

  @Field({ nullable: true })
  createdAt?: Date;

  @Field({ nullable: true })
  updatedAt?: Date;
}
