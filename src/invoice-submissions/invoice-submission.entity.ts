import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  Customer as CustomerModel,
  InvoiceSubmissionStatus,
  User as UserModel,
} from '../prisma/client/client';
import { InvoiceSubmissionItem } from './invoice-submission-item.entity';

export class InvoiceSubmission {
  @ApiProperty()
  id: number;

  @ApiProperty()
  number: string;

  @ApiProperty({ type: Date })
  date: Date;

  @ApiProperty({ type: Number })
  @Type(() => Number)
  amount: number;

  @ApiProperty({ nullable: true, type: String })
  description: string | null;

  @ApiProperty({ enum: InvoiceSubmissionStatus })
  status: InvoiceSubmissionStatus;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;

  @ApiProperty({ nullable: true, type: Date })
  submittedAt: Date | null;

  @ApiProperty({ nullable: true, type: Date })
  receivedAt: Date | null;

  @ApiProperty({ nullable: true, type: Date })
  paidAt: Date | null;

  @ApiProperty()
  userId: number;

  @ApiProperty()
  customerId: number;

  @ApiPropertyOptional({ type: Object })
  User?: UserModel;

  @ApiPropertyOptional({ type: Object })
  Customer?: CustomerModel;

  @ApiPropertyOptional({ type: () => [InvoiceSubmissionItem] })
  @Type(() => InvoiceSubmissionItem)
  invoiceSubmissionItems?: InvoiceSubmissionItem[];
}
