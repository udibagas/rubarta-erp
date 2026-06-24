import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsOptional,
  IsEnum,
  IsDateString,
  MaxLength,
  Min,
} from 'class-validator';
import { InteractionType } from '../../prisma/client/client';

export class CreateInteractionDto {
  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @IsInt()
  leadId?: number;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @IsInt()
  opportunityId?: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  userId: number;

  @ApiProperty({ enum: InteractionType, example: InteractionType.Meeting })
  @IsEnum(InteractionType)
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
  @IsInt()
  leadId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  opportunityId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
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
}
