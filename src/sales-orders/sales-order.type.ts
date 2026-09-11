import {
  ObjectType,
  Field,
  Int,
  Float,
  registerEnumType,
} from '@nestjs/graphql';
import { SalesOrderStatus } from '../prisma/client/client';
import { CustomerType } from '../customers/customer.type';
import { UserType } from '../users/user.type';

registerEnumType(SalesOrderStatus, {
  name: 'SalesOrderStatus',
  description: 'Status of a sales order',
});

@ObjectType('SalesOrderItem')
export class SalesOrderItemType {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  salesOrderId: number;

  @Field()
  partNumber: string;

  @Field()
  description: string;

  @Field(() => Int)
  quantity: number;

  @Field(() => Float)
  unitPrice: number;

  @Field(() => Float)
  totalPrice: number;

  @Field(() => Int)
  sortOrder: number;
}

@ObjectType('SalesOrder')
export class SalesOrderType {
  @Field(() => Int)
  id: number;

  @Field()
  number: string;

  @Field()
  referenceNumber: string;

  @Field()
  date: Date;

  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Float)
  totalAmount: number;

  @Field(() => Float)
  discount: number;

  @Field(() => Float)
  vatAmount: number;

  @Field(() => Float)
  grandTotal: number;

  @Field(() => SalesOrderStatus)
  status: SalesOrderStatus;

  @Field()
  currency: string;

  @Field({ nullable: true })
  shippingAddress?: string;

  @Field({ nullable: true })
  billingAddress?: string;

  @Field({ nullable: true })
  termOfPayment?: string;

  @Field({ nullable: true })
  deliveryDate?: Date;

  @Field({ nullable: true })
  deliveryMethod?: string;

  @Field({ nullable: true })
  termsAndConditions?: string;

  @Field({ nullable: true })
  termOfDelivery?: string;

  @Field({ nullable: true })
  paymentMethod?: string;

  @Field({ nullable: true })
  requestType?: string;

  @Field({ nullable: true })
  notes?: string;

  @Field({ nullable: true })
  customerAddress?: string;

  @Field({ nullable: true })
  contactPerson?: string;

  @Field({ nullable: true })
  contactPhone?: string;

  @Field({ nullable: true })
  contactEmail?: string;

  @Field({ nullable: true })
  createdAt?: Date;

  @Field({ nullable: true })
  updatedAt?: Date;

  @Field(() => Int)
  customerId: number;

  @Field(() => Int)
  userId: number;

  @Field(() => CustomerType, { nullable: true })
  Customer?: CustomerType;

  @Field(() => UserType, { nullable: true })
  User?: UserType;

  @Field(() => [SalesOrderItemType], { nullable: true })
  SalesOrderItems?: SalesOrderItemType[];
}
