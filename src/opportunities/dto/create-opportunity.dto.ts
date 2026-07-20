import { OpportunityStages } from '../../prisma/client/client';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class CreateOpportunityDto {
  userId: number;

  @IsNotEmpty({ message: 'Customer is required' })
  customerId: number;

  @IsNotEmpty({ message: 'Company is required' })
  companyId: number;

  @IsOptional()
  leadId: number;

  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @IsOptional()
  description?: string;

  @IsNotEmpty({ message: 'Stage is required' })
  @IsNumber({}, { message: 'Amount must be number' })
  amount: number;

  @IsOptional()
  @IsNumber({}, { message: 'Probability must be a number' })
  @Min(0, { message: 'Probability must be at least 0' })
  @Max(100, { message: 'Probability must be at most 100' })
  probability?: number;

  @IsNotEmpty({ message: 'Stage is required' })
  @IsEnum(OpportunityStages, { message: 'Invalid stage' })
  stage: OpportunityStages;

  @IsNotEmpty({ message: 'Expected close date is required' })
  expectedCloseDate: Date;
}
