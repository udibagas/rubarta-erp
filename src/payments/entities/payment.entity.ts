import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CashBankAccount } from '../../cash-bank/cash-bank-account.entity';
import { JournalEntry } from '../../journal-entries/journal-entry.entity';
import {
  AccountingPaymentStatus,
  Customer as CustomerModel,
  PaymentDirection,
  PaymentMethod,
  Supplier as SupplierModel,
  User as UserModel,
} from '../../prisma/client/client';
import { PaymentAllocation } from './payment-allocation.entity';

export class Payment {
  @ApiProperty()
  id: number;

  @ApiProperty()
  number: string;

  @ApiProperty({ enum: PaymentDirection })
  direction: PaymentDirection;

  @ApiProperty({ type: String, format: 'date' })
  date: Date;

  @ApiProperty({ enum: PaymentMethod })
  method: PaymentMethod;

  @ApiProperty({ nullable: true, type: Number })
  customerId: number | null;

  @ApiProperty({ nullable: true, type: Number })
  supplierId: number | null;

  @ApiProperty()
  cashBankAccountId: number;

  @ApiProperty({ nullable: true, type: String })
  reference: string | null;

  @ApiProperty()
  currency: string;

  @ApiProperty({ type: Number })
  @Type(() => Number)
  amount: number;

  @ApiProperty({ enum: AccountingPaymentStatus })
  status: AccountingPaymentStatus;

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

  @ApiPropertyOptional({ type: Object, nullable: true })
  customer?: CustomerModel | null;

  @ApiPropertyOptional({ type: Object, nullable: true })
  supplier?: SupplierModel | null;

  @ApiPropertyOptional({ type: () => CashBankAccount })
  @Type(() => CashBankAccount)
  cashBankAccount?: CashBankAccount;

  @ApiPropertyOptional({ type: () => JournalEntry, nullable: true })
  @Type(() => JournalEntry)
  journal?: JournalEntry | null;

  @ApiPropertyOptional({ type: Object })
  createdBy?: UserModel;

  @ApiPropertyOptional({ type: () => [PaymentAllocation] })
  @Type(() => PaymentAllocation)
  allocations?: PaymentAllocation[];
}
