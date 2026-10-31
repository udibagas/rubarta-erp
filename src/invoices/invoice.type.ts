import {
  ObjectType,
  Field,
  Int,
  Float,
  registerEnumType,
} from '@nestjs/graphql';
import { InvoiceStatus } from '../prisma/client/client';
import { CustomerType } from '../customers/customer.type';

registerEnumType(InvoiceStatus, {
  name: 'InvoiceStatus',
  description: 'Status of an invoice',
});

@ObjectType('InvoiceItem')
export class InvoiceItemType {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  invoiceId: number;

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
}

@ObjectType('Invoice')
export class InvoiceType {
  @Field(() => Int)
  id: number;

  @Field()
  number: string;

  @Field({ nullable: true })
  referenceNumber?: string;

  @Field()
  date: Date;

  @Field()
  dueDate: Date;

  @Field(() => InvoiceStatus)
  status: InvoiceStatus;

  @Field({ nullable: true })
  billingAddress?: string;

  @Field({ nullable: true })
  shippingAddress?: string;

  @Field()
  currency: string;

  @Field(() => Float)
  totalAmount: number;

  @Field(() => Float)
  discount: number;

  @Field(() => Float)
  vatAmount: number;

  @Field(() => Float)
  grandTotal: number;

  @Field()
  withTaxInvoice: boolean;

  @Field({ nullable: true })
  taxInvoiceNumber?: string;

  @Field({ nullable: true })
  paymentMethod?: string;

  @Field({ nullable: true })
  termOfPayment?: string;

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
  userId: number;

  @Field(() => Int)
  salesOrderId: number;

  @Field(() => Int)
  deliveryOrderId: number;

  @Field(() => Int)
  customerId: number;

  @Field(() => CustomerType, { nullable: true })
  Customer?: CustomerType;

  @Field(() => [InvoiceItemType], { nullable: true })
  InvoiceItems?: InvoiceItemType[];
}
