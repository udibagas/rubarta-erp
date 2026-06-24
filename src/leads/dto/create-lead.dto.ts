import { ApiProperty } from '@nestjs/swagger';
import { LeadSource, LeadStatus } from '../../prisma/client/client';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateLeadDto {
  @ApiProperty({ example: 'Pneumatic Systems Upgrade Project' })
  @IsNotEmpty({ message: 'Title is required' })
  @IsString({ message: 'Invalid title' })
  title: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Company is required' })
  @IsNumber({}, { message: 'Invalid company' })
  companyId: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'User is required' })
  @IsNumber({}, { message: 'Invalid user' })
  userId: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Customer is required' })
  @IsNumber({}, { message: 'Invalid customer' })
  customerId: number;

  @ApiProperty({ enum: LeadSource, example: LeadSource.Website })
  @IsNotEmpty({ message: 'Source is required' })
  @IsEnum(LeadSource, { message: 'Invalid source' })
  source: LeadSource;

  @ApiProperty({
    enum: LeadStatus,
    example: LeadStatus.New,
    default: LeadStatus.New,
  })
  @IsOptional()
  @IsEnum(LeadStatus, { message: 'Invalid status' })
  status?: LeadStatus;

  @ApiProperty({ required: false, example: 50000000 })
  @IsOptional()
  @IsNumber()
  estimatedValue?: number;

  @ApiProperty({ required: false, example: 'Interested in our product line' })
  @IsOptional()
  @IsString()
  notes?: string;
}
