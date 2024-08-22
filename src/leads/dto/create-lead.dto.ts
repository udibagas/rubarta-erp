import { LeadSource, LeadStatus } from '@prisma/client';
import { isEnum, IsEnum, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateLeadDto {
  @IsNumber({}, { message: 'Invalid customer' })
  customerId: number;

  @IsNotEmpty({ message: 'Source is required' })
  @IsEnum(LeadSource, { message: 'Invalid source' })
  source: LeadSource;

  @IsEnum(LeadStatus, { message: 'Invalid status' })
  status: LeadStatus;

  @IsNotEmpty({ message: 'Not is required' })
  note: string;
}
