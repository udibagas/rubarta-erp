import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { InvoiceSubmissionStatus } from '../prisma/client/client';

export class CreateInvoiceSubmissionDto {
  @Type(() => Date)
  @IsDate()
  date: Date;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  customerId: number;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'Must contain at least 1 invoice' })
  @ArrayUnique()
  @IsInt({ each: true })
  invoiceIds?: number[];
}

export class UpdateInvoiceSubmissionDto extends PartialType(
  CreateInvoiceSubmissionDto,
) {}

export class UpdateInvoiceSubmissionStatusDto {
  @IsEnum(InvoiceSubmissionStatus)
  status: InvoiceSubmissionStatus;
}

export class QueryInvoiceSubmissionsDto {
  @IsOptional()
  @IsEnum(InvoiceSubmissionStatus)
  status?: InvoiceSubmissionStatus;

  @IsOptional()
  @IsNumberString()
  customerId?: string;
}
