import { ApiProperty } from '@nestjs/swagger';
import { JsonValue } from '@prisma/client/runtime/library';
import { Type } from 'class-transformer';
// import { JsonValue } from '@prisma/client/runtime/library';
import { IsDateString, IsNotEmpty, IsNumber } from 'class-validator';

export class Attachment {
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
}

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
  @Type(() => Attachment)
  attachment?: Attachment;
}
