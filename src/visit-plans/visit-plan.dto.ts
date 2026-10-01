import { VisitPlanStatus, VisitType } from '../prisma/client/client';
import { Type, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateVisitPlanDto {
  userId: number;

  @IsNotEmpty({ message: 'Customer is required' })
  @IsInt({ message: 'Invalid customer' })
  customerId: number;

  @IsNotEmpty({ message: 'Company is required' })
  @IsInt({ message: 'Invalid company' })
  companyId: number;

  @IsOptional()
  @IsInt({ message: 'Invalid contact' })
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
  cancelReason?: string;

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

export class UpdateVisitPlanDto extends PartialType(CreateVisitPlanDto) {}

export class QueryVisitPlanDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;

  @IsOptional()
  companyId?: number | string | number[] | string[];

  @IsOptional()
  customerId?: number | string | number[] | string[];

  @IsOptional()
  userId?: number | string | number[] | string[];

  @IsOptional()
  @IsEnum(VisitPlanStatus, { each: true })
  status?: VisitPlanStatus | VisitPlanStatus[];

  @IsOptional()
  @IsEnum(VisitType, { each: true })
  visitType?: VisitType | VisitType[];

  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  year?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @IsIn(['true', 'false'])
  upcoming?: string;
}
