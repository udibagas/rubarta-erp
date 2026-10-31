import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Invoice as InvoiceModel } from '../../prisma/client/client';
import { VendorBill } from '../../vendor-bills/vendor-bill.entity';
import { Payment } from './payment.entity';

export class PaymentAllocation {
  @ApiProperty()
  id: number;

  @ApiProperty()
  paymentId: number;

  @ApiProperty({ nullable: true, type: Number })
  invoiceId: number | null;

  @ApiProperty({ nullable: true, type: Number })
  vendorBillId: number | null;

  @ApiProperty({ type: Number })
  @Type(() => Number)
  amount: number;

  @ApiPropertyOptional({ type: () => Payment })
  @Type(() => Payment)
  payment?: Payment;

  @ApiPropertyOptional({ type: Object, nullable: true })
  invoice?: InvoiceModel | null;

  @ApiPropertyOptional({ type: () => VendorBill, nullable: true })
  @Type(() => VendorBill)
  vendorBill?: VendorBill | null;
}
