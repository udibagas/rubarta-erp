import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType('Material')
export class MaterialType {
  @Field(() => Int)
  id: number;

  @Field()
  partNumber: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  model?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  category?: string;

  @Field()
  unit: string;

  @Field(() => Float, { nullable: true })
  weight?: number;

  @Field({ nullable: true })
  purchaseCurrency?: string;

  @Field({ nullable: true })
  sellingCurrency?: string;

  @Field(() => Float, { nullable: true })
  purchasePrice?: number;

  @Field(() => Float, { nullable: true })
  sellingPrice?: number;

  @Field(() => Int, { nullable: true })
  minStock?: number;

  @Field(() => Int, { nullable: true })
  currentStock?: number;

  @Field()
  isActive: boolean;

  @Field(() => Int, { nullable: true })
  supplierId?: number;

  @Field(() => Int, { nullable: true })
  leadTime?: number;

  @Field({ nullable: true })
  createdAt?: Date;

  @Field({ nullable: true })
  updatedAt?: Date;
}
