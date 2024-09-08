import { OpportunityStages } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateOpportunityDto {
  userId: number;

  @IsNotEmpty({ message: 'Customer is required' })
  customerId: number;

  @IsNotEmpty({ message: 'Company is required' })
  companyId: number;

  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @IsNotEmpty({ message: 'Stage is required' })
  @IsNumber({}, { message: 'Amount must be number' })
  amount: number;

  @IsNotEmpty({ message: 'Stage is required' })
  @IsEnum(OpportunityStages, { message: 'Invalid stage' })
  stage: OpportunityStages;

  @IsNotEmpty({ message: 'Expected close date is required' })
  expectedCloseDate: Date;
}
