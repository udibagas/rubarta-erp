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

export class ExpenseClaimDto {
  @ApiProperty()
  @IsNumber({}, { message: 'Invalid User' })
  @IsNotEmpty()
  userId: number;

  @ApiProperty()
  @IsNumber({}, { message: 'Invalid Department' })
  @IsNotEmpty()
  departmentId: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  totalAmount: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  cashAdvance: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  claim: number;

  @ApiProperty()
  @IsEnum(ClaimStatus)
  status: ClaimStatus;

  @ApiProperty()
  @IsNumber({}, { message: 'Invalid Company' })
  @IsNotEmpty()
  companyId: number;

  @ApiProperty({
    example: [
      {
        date: '2024-07-01',
        expenseTypeId: 1,
        description: 'BBM Pertamax 20 Liter',
        amount: 200_000,
      },
    ],
  })
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => ExpenseClaimItemDto)
  @ValidateNested({ each: true })
  items: ExpenseClaimItemDto[];
}

export class ExpenseClaimItemDto {
  @ApiProperty({
    description: 'Refers to ExpenseType ID',
  })
  @IsDate()
  date: Date;

  @ApiProperty()
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
