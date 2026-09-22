import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsOptional,
  IsEnum,
  IsDateString,
  MaxLength,
  Min,
  IsBoolean,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { InteractionType } from '../prisma/client/client';

export class CreateInteractionDto {
  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @IsInt()
  leadId?: number;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @IsInt()
  opportunityId?: number;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @IsInt()
  contactId?: number;

  @ApiProperty({ example: 1 })
  @IsInt({ message: 'Invalid User' })
  userId: number;

  @ApiProperty({ enum: InteractionType, example: InteractionType.Meeting })
  @IsEnum(InteractionType, { message: 'Invalid Interaction Type' })
  type: InteractionType;

  @ApiProperty({ example: '2025-05-25T10:00:00Z' })
  @IsDateString()
  date: string;

  @ApiProperty({ required: false, example: 60 })
  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;

  @ApiProperty({ required: false, example: 'Project discussion' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @ApiProperty({ required: false, example: 'Discussed project requirements' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false, example: 'Customer interested in product' })
  @IsOptional()
  @IsString()
  outcome?: string;
}

export class UpdateInteractionDto extends PartialType(CreateInteractionDto) {}

export class QueryInteractionDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  leadId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  opportunityId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  contactId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;

  @ApiProperty({ required: false, enum: InteractionType })
  @IsOptional()
  @IsEnum(InteractionType)
  type?: InteractionType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  customerId?: number;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  pageSize?: number;
}
