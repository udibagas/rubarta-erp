import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsDateString,
  IsBoolean,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuotationStatus, Currency } from '../../prisma/client/client';

export class QuotationItemDto {
  @ApiProperty({ example: 'PART-001' })
  @IsString()
  @MaxLength(100)
  partNumber: string;

  @ApiProperty({ example: 'Product description' })
  @IsString()
  description: string;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 100000 })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiProperty({ required: false, example: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiProperty({ required: false, example: false, default: false })
  @IsOptional()
  @IsBoolean()
  vat?: boolean;

  @ApiProperty({ required: false, example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class CreateQuotationDto {
  @ApiProperty({ example: 'QUO-2025-001' })
  @IsString()
  @MaxLength(50)
  number: string;

  @ApiProperty({ example: 'Quotation for Office Equipment' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({ required: false, example: 'Detailed description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  customerId: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  userId: number;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @IsInt()
  opportunityId?: number;

  @ApiProperty({ enum: Currency, example: Currency.IDR, default: Currency.IDR })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiProperty({ required: false, example: 30, default: 30 })
  @IsOptional()
  @IsInt()
  @Min(1)
  validity?: number;

  @ApiProperty({ example: '2025-06-25' })
  @IsDateString()
  validUntil: string;

  @ApiProperty({ required: false, example: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiProperty({ required: false, example: 'Terms and conditions' })
  @IsOptional()
  @IsString()
  terms?: string;

  @ApiProperty({ required: false, example: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [QuotationItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuotationItemDto)
  items: QuotationItemDto[];
}

export class UpdateQuotationDto extends PartialType(CreateQuotationDto) {
  @ApiProperty({ enum: QuotationStatus, required: false })
  @IsOptional()
  @IsEnum(QuotationStatus)
  status?: QuotationStatus;
}

export class QueryQuotationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  customerId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  opportunityId?: number;

  @ApiProperty({ required: false, enum: QuotationStatus })
  @IsOptional()
  @IsEnum(QuotationStatus)
  status?: QuotationStatus;
}
