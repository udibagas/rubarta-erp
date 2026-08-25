import { ObjectType, Field, Int, registerEnumType } from '@nestjs/graphql';
import { Role } from '../prisma/client/client';

// Register the Role enum for GraphQL
registerEnumType(Role, {
  name: 'Role',
  description: 'User roles in the system',
});

@ObjectType('User')
export class UserType {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  code?: string;

  @Field({ nullable: true })
  bankAccount?: string;

  @Field({ nullable: true })
  currency?: string;

  @Field()
  active: boolean;

  @Field(() => Int, { nullable: true })
  bankId?: number;

  @Field(() => Int, { nullable: true })
  departmentId?: number;

  @Field({ nullable: true })
  signatureSpeciment?: string;

  @Field(() => [Role])
  roles: Role[];

  @Field({ nullable: true })
  createdAt?: Date;

  @Field({ nullable: true })
  updatedAt?: Date;
}
