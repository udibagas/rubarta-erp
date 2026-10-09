import { ObjectType, Field, Int, registerEnumType } from '@nestjs/graphql';
import { GoodsReceiptStatus, PaymentStatus } from '../prisma/client/client';
import { SupplierType } from '../suppliers/supplier.type';
import { PurchaseOrderType } from '../purchase-orders/purchase-order.type';
import { UserType } from '../users/user.type';

registerEnumType(GoodsReceiptStatus, {
  name: 'GoodsReceiptStatus',
  description: 'Status of a goods receipt',
});

registerEnumType(PaymentStatus, {
  name: 'PaymentStatus',
  description: 'Status of a payment',
});

@ObjectType('GoodsReceiptItem')
export class GoodsReceiptItemType {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  goodsReceiptId: number;

  @Field()
  partNumber: string;

  @Field()
  partNumberSupplier: string;

  @Field()
  description: string;

  @Field(() => Int)
  quantityOrder: number;

  @Field(() => Int)
  quantityReceived: number;
}

@ObjectType('GoodsReceipt')
export class GoodsReceiptType {
  @Field(() => Int)
  id: number;

  @Field()
  number: string;

  @Field({ nullable: true })
  referenceNumber?: string;

  @Field()
  date: Date;

  @Field()
  sender: string;

  @Field()
  recipient: string;

  @Field(() => GoodsReceiptStatus)
  status: GoodsReceiptStatus;

  @Field(() => PaymentStatus, { nullable: true })
  paymentStatus?: PaymentStatus;

  @Field({ nullable: true })
  notes?: string;

  @Field({ nullable: true })
  vendorInvoiceNumber?: string;

  @Field(() => Int)
  purchaseOrderId: number;

  @Field(() => Int)
  supplierId: number;

  @Field(() => Int)
  companyId: number;

  @Field(() => Int)
  userId: number;

  @Field({ nullable: true })
  createdAt?: Date;

  @Field({ nullable: true })
  updatedAt?: Date;

  @Field(() => SupplierType, { nullable: true })
  Supplier?: SupplierType;

  @Field(() => PurchaseOrderType, { nullable: true })
  PurchaseOrder?: PurchaseOrderType;

  @Field(() => UserType, { nullable: true })
  User?: UserType;

  @Field(() => [GoodsReceiptItemType], { nullable: true })
  GoodsReceiptItems?: GoodsReceiptItemType[];
}
