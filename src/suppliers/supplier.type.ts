import { ObjectType, Field, Int, registerEnumType } from '@nestjs/graphql';
import { Currency } from '../prisma/client/client';

registerEnumType(Currency, {
  name: 'Currency',
  description: 'Supported currencies',
});

@ObjectType('Supplier')
export class SupplierType {
  @Field(() => Int)
  id: number;

  @Field({ nullable: true })
  code?: string;

  @Field()
  name: string;

  @Field()
  address: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  email?: string;

  @Field(() => Int)
  bankId: number;

  @Field()
  bankAccount: string;

  @Field(() => Currency)
  currency: Currency;
}
