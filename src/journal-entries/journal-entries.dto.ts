import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { JournalSource } from '../prisma/client/client';

export class JournalLineDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  accountId: number;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  debit: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  credit: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

export class CreateJournalEntryDto {
  @IsString()
  @MinLength(1)
  number: string;

  @IsDate({ message: 'Invalid date' })
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  date: Date;

  @IsString()
  @MinLength(1)
  description: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  periodId: number;

  @IsOptional()
  @IsEnum(JournalSource)
  source?: JournalSource;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sourceId?: number;

  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => JournalLineDto)
  lines: JournalLineDto[];
}

export class ReverseJournalEntryDto {
  @IsString()
  @MinLength(1)
  number: string;

  @IsDate({ message: 'Invalid date' })
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  date: Date;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  periodId: number;
}
