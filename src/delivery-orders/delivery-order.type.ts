import { ObjectType, Field, Int } from '@nestjs/graphql';
import { SalesOrderType } from '../sales-orders/sales-order.type';
import { CustomerType } from '../customers/customer.type';
import { CompanyType } from '../companies/company.type';
import { UserType } from '../users/user.type';

@ObjectType('DeliveryOrderItem')
export class DeliveryOrderItemType {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  deliveryOrderId: number;

  @Field()
  partNumber: string;

  @Field()
  partNumberSupply: string;

  @Field()
  description: string;

  @Field(() => Int)
  quantityOrder: number;

  @Field(() => Int)
  quantitySupply: number;
}

@ObjectType('DeliveryOrder')
export class DeliveryOrderType {
  @Field(() => Int)
  id: number;

  @Field()
  number: string;

  @Field()
  date: Date;

  @Field({ nullable: true })
  sender?: string;

  @Field({ nullable: true })
  recipient?: string;

  @Field({ nullable: true })
  notes?: string;

  @Field({ nullable: true })
  createdAt?: Date;

  @Field({ nullable: true })
  updatedAt?: Date;

  @Field(() => Int)
  companyId: number;

  @Field(() => Int)
  salesOrderId: number;

  @Field(() => Int)
  customerId: number;

  @Field(() => Int)
  userId: number;

  @Field(() => CompanyType, { nullable: true })
  Company?: CompanyType;

  @Field(() => SalesOrderType, { nullable: true })
  SalesOrder?: SalesOrderType;

  @Field(() => CustomerType, { nullable: true })
  Customer?: CustomerType;

  @Field(() => UserType, { nullable: true })
  User?: UserType;

  @Field(() => [DeliveryOrderItemType], { nullable: true })
  DeliveryOrderItems?: DeliveryOrderItemType[];
}
