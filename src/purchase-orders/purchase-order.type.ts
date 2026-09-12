import {
  ObjectType,
  Field,
  Int,
  Float,
  registerEnumType,
} from '@nestjs/graphql';
import { Currency, PurchaseOrderStatus } from '../prisma/client/client';
import { SupplierType } from '../suppliers/supplier.type';
import { CompanyType } from '../companies/company.type';
import { UserType } from '../users/user.type';

registerEnumType(PurchaseOrderStatus, {
  name: 'PurchaseOrderStatus',
  description: 'Status of a purchase order',
});

@ObjectType('PurchaseOrderItem')
export class PurchaseOrderItemType {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  purchaseOrderId: number;

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

@ObjectType('PurchaseOrder')
export class PurchaseOrderType {
  @Field(() => Int)
  id: number;

  @Field()
  number: string;

  @Field({ nullable: true })
  orderType?: string;

  @Field()
  date: Date;

  @Field()
  referenceNumber: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => PurchaseOrderStatus)
  status: PurchaseOrderStatus;

  @Field(() => Currency)
  currency: Currency;

  @Field(() => Float)
  currencyRate: number;

  @Field(() => Float)
  totalAmount: number;

  @Field(() => Float)
  discount: number;

  @Field(() => Float)
  vatAmount: number;

  @Field(() => Float)
  grandTotal: number;

  @Field({ nullable: true })
  deliveryMethod?: string;

  @Field({ nullable: true })
  destination?: string;

  @Field({ nullable: true })
  warehouse?: string;

  @Field({ nullable: true })
  packingCondition?: string;

  @Field({ nullable: true })
  shippingAddress?: string;

  @Field({ nullable: true })
  deliveryDate?: Date;

  @Field({ nullable: true })
  termOfDelivery?: string;

  @Field({ nullable: true })
  partialShipment?: boolean;

  @Field({ nullable: true })
  paymentMethod?: string;

  @Field({ nullable: true })
  termOfPayment?: string;

  @Field({ nullable: true })
  supplierAddress?: string;

  @Field({ nullable: true })
  billingAddress?: string;

  @Field({ nullable: true })
  termsAndConditions?: string;

  @Field({ nullable: true })
  notes?: string;

  @Field({ nullable: true })
  createdAt?: Date;

  @Field({ nullable: true })
  updatedAt?: Date;

  @Field(() => Int, { nullable: true })
  supplierId?: number;

  @Field(() => Int)
  userId: number;

  @Field(() => Int)
  companyId: number;

  @Field(() => SupplierType, { nullable: true })
  Supplier?: SupplierType;

  @Field(() => CompanyType, { nullable: true })
  Company?: CompanyType;

  @Field(() => UserType, { nullable: true })
  User?: UserType;

  @Field(() => [PurchaseOrderItemType], { nullable: true })
  PurchaseOrderItems?: PurchaseOrderItemType[];
}
