import {
  ObjectType,
  Field,
  Int,
  Float,
  registerEnumType,
} from '@nestjs/graphql';
import { QuotationStatus } from '../prisma/client/client';
import { CustomerType } from '../customers/customer.type';
import { UserType } from '../users/user.type';

registerEnumType(QuotationStatus, {
  name: 'QuotationStatus',
  description: 'Status of a quotation',
});

@ObjectType('QuotationOpportunity')
export class QuotationOpportunityType {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;
}

@ObjectType('QuotationItem')
export class QuotationItemType {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  quotationId: number;

  @Field()
  partNumber: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  model?: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Int)
  quantity: number;

  @Field(() => Float)
  unitPrice: number;

  @Field(() => Float)
  totalPrice: number;

  @Field(() => Int)
  sortOrder: number;
}

@ObjectType('Quotation')
export class QuotationType {
  @Field(() => Int)
  id: number;

  @Field()
  number: string;

  @Field({ nullable: true })
  date?: Date;

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

  @Field(() => QuotationStatus)
  status: QuotationStatus;

  @Field()
  currency: string;

  @Field(() => Int)
  validity: number;

  @Field()
  validUntil: Date;

  @Field({ nullable: true })
  sentDate?: Date;

  @Field({ nullable: true })
  acceptedDate?: Date;

  @Field({ nullable: true })
  notes?: string;

  @Field({ nullable: true })
  termOfPayment?: string;

  @Field({ nullable: true })
  termsAndConditions?: string;

  @Field({ nullable: true })
  termOfDelivery?: string;

  @Field({ nullable: true })
  paymentMethod?: string;

  @Field({ nullable: true })
  requestType?: string;

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

  @Field(() => Int, { nullable: true })
  opportunityId?: number;

  @Field(() => Int, { nullable: true })
  companyId?: number;

  @Field(() => CustomerType, { nullable: true })
  Customer?: CustomerType;

  @Field(() => UserType, { nullable: true })
  User?: UserType;

  @Field(() => QuotationOpportunityType, { nullable: true })
  Opportunity?: QuotationOpportunityType;

  @Field(() => [QuotationItemType], { nullable: true })
  QuotationItems?: QuotationItemType[];
}
