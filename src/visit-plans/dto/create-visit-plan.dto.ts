import { VisitPlanStatus, VisitType } from '../../prisma/client/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  ValidateIf,
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

  @IsOptional()
  @IsEnum(VisitType, { message: 'Invalid visit type' })
  visitType?: VisitType;

  @ValidateIf((o) => o.visitType === 'Online')
  @IsUrl({}, { message: 'Invalid meeting URL' })
  @IsOptional()
  meetingUrl?: string;

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
