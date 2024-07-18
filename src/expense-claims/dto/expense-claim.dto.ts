import { ApiProperty } from '@nestjs/swagger';
import { ClaimStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';

export class ExpenseClaimItemDto {
  @ApiProperty({
    description: 'Date object',
    example: new Date('2024-07-01'),
  })
  @IsDate({ message: 'Invalid date. Please use date object' })
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

export class ExpenseClaimDto {
  userId: number;

  @ApiProperty({ example: 1 })
  @IsNumber({}, { message: 'Invalid Department' })
  @IsNotEmpty()
  departmentId: number;

  @ApiProperty({ example: 2_000_000 })
  @IsNumber()
  @IsNotEmpty()
  totalAmount: number;

  @ApiProperty({ example: 1_000_000 })
  @IsNumber()
  @IsNotEmpty()
  cashAdvance: number;

  @ApiProperty({ example: 1_000_000 })
  @IsNumber()
  @IsNotEmpty()
  claim: number;

  @ApiProperty({ example: 'DRAFT | SUBMITTED' })
  @IsEnum(ClaimStatus)
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
  items: ExpenseClaimItemDto[];
}
