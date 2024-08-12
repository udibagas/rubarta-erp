import { ApiProperty } from '@nestjs/swagger';
import { ClaimStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  ValidateNested,
} from 'class-validator';

export class ExpenseClaimItemDto {
  @ApiProperty({
    description: 'Date string',
    example: '2024-07-01',
  })
  @IsDateString({}, { message: 'Invalid date string' })
  date: Date;

  @ApiProperty({ example: 1 })
  @IsNumber({}, { message: 'Invalid expense type' })
  expenseTypeId: number;

  @ApiProperty({
    example: 'BBM Pertamax 20 Liter',
  })
  @IsNotEmpty({ message: 'Description is required' })
  description: string;

  @ApiProperty({ example: 200_000 })
  @IsNumber({}, { message: 'Invalid amount' })
  amount: number;
}

export class ExpenseClaimAttachmentDto {
  @IsNotEmpty()
  fileName: string;

  @IsNotEmpty()
  filePath: string;

  @IsNotEmpty()
  fileType: string;

  @IsNumber()
  fileSize: number;
}

export class ExpenseClaimDto {
  @IsNumber({}, { message: 'Invalid Employee' })
  @IsNotEmpty({ message: 'Employee is required' })
  employeeId: number;

  @ApiProperty({ example: 1 })
  @IsNumber({}, { message: 'Invalid Department' })
  @IsNotEmpty({ message: 'Department is required' })
  departmentId: number;

  @ApiProperty({ example: 2_000_000 })
  @IsNumber()
  @IsNotEmpty({ message: 'Total amount is required' })
  totalAmount: number;

  @ApiProperty({ example: 1_000_000 })
  @IsNumber()
  @IsNotEmpty({ message: 'Cash advance is required' })
  cashAdvance: number;

  @ApiProperty({ example: 1_000_000 })
  @IsNumber()
  @IsNotEmpty({ message: 'Claim is required' })
  claim: number;

  @ApiProperty({ example: 'DRAFT | SUBMITTED' })
  @IsEnum(ClaimStatus, { message: 'Invalid status' })
  status: ClaimStatus;

  @ApiProperty({ example: 1 })
  @IsNumber({}, { message: 'Invalid Company' })
  @IsNotEmpty()
  companyId: number;

  @ApiProperty({
    type: ExpenseClaimItemDto,
    isArray: true,
  })
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => ExpenseClaimItemDto)
  @ValidateNested({ each: true })
  ExpenseClaimItem: ExpenseClaimItemDto[];

  @ApiProperty({
    type: ExpenseClaimAttachmentDto,
    isArray: true,
  })
  @IsArray()
  @Type(() => ExpenseClaimAttachmentDto)
  @ValidateNested({ each: true })
  ExpenseClaimAttachment?: ExpenseClaimAttachmentDto[];
}
