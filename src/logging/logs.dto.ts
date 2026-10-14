import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const LOG_LEVELS = ['fatal', 'error', 'warn', 'log', 'debug', 'verbose'];

export class QueryLogsDto {
  @ApiPropertyOptional({ enum: LOG_LEVELS })
  @IsOptional()
  @IsIn(LOG_LEVELS)
  level?: string;

  @ApiPropertyOptional({ description: 'Exact context, e.g. AuthService' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  context?: string;

  @ApiPropertyOptional({ description: 'Case-insensitive search in message' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @ApiPropertyOptional({ description: 'ISO date, inclusive' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @ApiPropertyOptional({ description: 'ISO date, inclusive' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;

  @ApiPropertyOptional({
    description: 'Return rows with id lower than this (from `nextCursor`)',
  })
  @IsOptional()
  @Matches(/^\d{1,18}$/)
  cursor?: string;

  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}
