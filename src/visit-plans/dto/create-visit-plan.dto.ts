import { VisitPlanStatus } from '../../prisma/client/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateVisitPlanDto {
  userId: number;

  @IsNotEmpty({ message: 'Customer is required' })
  @IsInt()
  customerId: number;

  @IsNotEmpty({ message: 'Company is required' })
  @IsInt()
  companyId: number;

  @IsOptional()
  @IsInt()
  contactId?: number;

  @IsNotEmpty({ message: 'Title is required' })
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  purpose?: string;

  @IsNotEmpty({ message: 'Scheduled date is required' })
  scheduledDate: Date;

  @IsOptional()
  @IsString()
  scheduledTime?: string;

  @IsOptional()
  @IsInt()
  estimatedDuration?: number;

  @IsOptional()
  @IsEnum(VisitPlanStatus, { message: 'Invalid status' })
  status?: VisitPlanStatus;

  @IsOptional()
  actualVisitDate?: Date;

  @IsOptional()
  @IsString()
  outcome?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  contactPerson?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;
}
