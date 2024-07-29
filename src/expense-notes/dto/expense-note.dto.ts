import { ApiProperty } from '@nestjs/swagger';
import { JsonObject } from '@prisma/client/runtime/library';
import {
  IsDateString,
  IsJSON,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
} from 'class-validator';

export class ExpenseNoteDto {
  userId: number;

  @ApiProperty({ description: 'Date', example: '2024-07-01' })
  @IsDateString()
  @IsNotEmpty({ message: 'Date is required' })
  date: Date;

  @ApiProperty({ description: 'Expense Type ID', example: 1 })
  @IsNumber()
  @IsNotEmpty({ message: 'Expense type is required' })
  expenseTypeId: number;

  @ApiProperty({ description: 'Expense description', example: 'BBM 20 Liter' })
  @IsNotEmpty({ message: 'Description is required' })
  description: string;

  @ApiProperty({ description: 'Expense amount', example: 200_0000 })
  @IsNumber({}, { message: 'Amount must be a number' })
  amount: number;

  @ApiProperty({ description: 'Attachment object' })
  @IsOptional()
  @IsObject({ message: 'Invalid object' })
  attachment: JsonObject;
}
