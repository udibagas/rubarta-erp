import { LeadSource, LeadStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateLeadDto {
  @IsNotEmpty({ message: 'Company is required' })
  @IsNumber({}, { message: 'Invalid company' })
  companyId: number;

  userId: number;

  @IsNotEmpty({ message: 'Customer is required' })
  @IsNumber({}, { message: 'Invalid customer' })
  customerId: number;

  @IsNotEmpty({ message: 'Source is required' })
  @IsEnum(LeadSource, { message: 'Invalid source' })
  source: LeadSource;

  @IsEnum(LeadStatus, { message: 'Invalid status' })
  status: LeadStatus;

  @IsNotEmpty({ message: 'Notes is required' })
  notes: string;
}
