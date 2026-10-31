import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Invoice } from '../invoices/invoice.entity';
import { InvoiceSubmission } from './invoice-submission.entity';

export class InvoiceSubmissionItem {
  @ApiProperty()
  id: number;

  @ApiProperty()
  invoiceSubmissionId: number;

  @ApiProperty()
  invoiceId: number;

  @ApiPropertyOptional({ type: () => InvoiceSubmission })
  @Type(() => InvoiceSubmission)
  InvoiceSubmission?: InvoiceSubmission;

  @ApiPropertyOptional({ type: () => Invoice })
  @Type(() => Invoice)
  Invoice?: Invoice;
}
