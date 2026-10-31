import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { JournalEntry } from '../journal-entries/journal-entry.entity';
import { PaymentAllocation } from '../payments/entities/payment-allocation.entity';
import {
  PurchaseOrder as PurchaseOrderModel,
  SettlementStatus,
  Supplier as SupplierModel,
  User as UserModel,
} from '../prisma/client/client';

export class VendorBill {
  @ApiProperty()
  id: number;

  @ApiProperty()
  number: string;

  @ApiProperty({ nullable: true, type: String })
  vendorRef: string | null;

  @ApiProperty()
  supplierId: number;

  @ApiProperty({ nullable: true, type: Number })
  purchaseOrderId: number | null;

  @ApiProperty({ type: String, format: 'date' })
  date: Date;

  @ApiProperty({ type: String, format: 'date' })
  dueDate: Date;

  @ApiProperty()
  currency: string;

  @ApiProperty({ type: Number })
  @Type(() => Number)
  subtotal: number;

  @ApiProperty({ type: Number })
  @Type(() => Number)
  taxAmount: number;

  @ApiProperty({ type: Number })
  @Type(() => Number)
  total: number;

  @ApiProperty({ type: Number })
  @Type(() => Number)
  paidAmount: number;

  @ApiProperty({ enum: SettlementStatus })
  status: SettlementStatus;

  @ApiProperty({ nullable: true, type: String })
  notes: string | null;

  @ApiProperty({ nullable: true, type: Number })
  journalId: number | null;

  @ApiProperty()
  createdById: number;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;

  @ApiPropertyOptional({ type: Object })
  supplier?: SupplierModel;

  @ApiPropertyOptional({ type: Object, nullable: true })
  purchaseOrder?: PurchaseOrderModel | null;

  @ApiPropertyOptional({ type: () => JournalEntry, nullable: true })
  @Type(() => JournalEntry)
  journal?: JournalEntry | null;

  @ApiPropertyOptional({ type: Object })
  createdBy?: UserModel;

  @ApiPropertyOptional({ type: () => [PaymentAllocation] })
  @Type(() => PaymentAllocation)
  allocations?: PaymentAllocation[];
}
