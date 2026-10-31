import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Company as CompanyModel,
  Currency,
  Customer as CustomerModel,
  DeliveryOrder as DeliveryOrderModel,
  Invoice as InvoiceModel,
  InvoiceItem as InvoiceItemModel,
  InvoiceStatus,
  PaymentAllocation as PaymentAllocationModel,
  Prisma,
  SalesOrder as SalesOrderModel,
  User as UserModel,
} from '../prisma/client/client';

export class Invoice {
  @ApiProperty()
  id: number;

  @ApiProperty()
  number: string;

  @ApiPropertyOptional({ nullable: true })
  referenceNumber: string | null;

  @ApiProperty({ type: Date })
  date: Date;

  @ApiProperty({ type: Date })
  dueDate: Date;

  @ApiProperty({ enum: InvoiceStatus })
  status: InvoiceStatus;

  @ApiPropertyOptional({ nullable: true })
  billingAddress: string | null;

  @ApiPropertyOptional({ nullable: true })
  shippingAddress: string | null;

  @ApiPropertyOptional({ type: Object, nullable: true })
  attachments: Prisma.JsonValue | null;

  @ApiPropertyOptional({ nullable: true })
  receiptNumber: string | null;

  @ApiPropertyOptional({ nullable: true, type: Date })
  receiptDate: Date | null;

  @ApiPropertyOptional({ type: Object, nullable: true })
  receiptFile: Prisma.JsonValue | null;

  @ApiPropertyOptional({ type: Object, nullable: true })
  bank: Prisma.JsonValue | null;

  @ApiProperty({ enum: Currency })
  currency: Currency;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  discount: number;

  @ApiProperty()
  vatAmount: number;

  @ApiProperty()
  grandTotal: number;

  @ApiProperty()
  withTaxInvoice: boolean;

  @ApiPropertyOptional({ nullable: true })
  taxInvoiceNumber: string | null;

  @ApiPropertyOptional({ nullable: true })
  paymentMethod: string | null;

  @ApiPropertyOptional({ nullable: true })
  termOfPayment: string | null;

  @ApiPropertyOptional({ nullable: true })
  contactPerson: string | null;

  @ApiPropertyOptional({ nullable: true })
  contactPhone: string | null;

  @ApiPropertyOptional({ nullable: true })
  contactEmail: string | null;

  @ApiProperty()
  userId: number;

  @ApiProperty()
  salesOrderId: number;

  @ApiProperty()
  deliveryOrderId: number;

  @ApiProperty()
  customerId: number;

  @ApiPropertyOptional({ nullable: true })
  companyId: number | null;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;

  @ApiPropertyOptional({ type: Object })
  Customer?: CustomerModel;

  @ApiPropertyOptional({ type: Object, nullable: true })
  Company?: CompanyModel | null;

  @ApiPropertyOptional({ type: [Object] })
  PaymentAllocations?: PaymentAllocationModel[];

  @ApiPropertyOptional({ type: Object })
  SalesOrder?: SalesOrderModel;

  @ApiPropertyOptional({ type: Object })
  DeliveryOrder?: DeliveryOrderModel;

  @ApiPropertyOptional({ type: Object })
  User?: UserModel;

  @ApiPropertyOptional({ type: [Object] })
  InvoiceItems?: InvoiceItemModel[];
}
