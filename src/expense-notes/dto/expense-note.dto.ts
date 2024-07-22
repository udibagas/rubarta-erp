import { ApiProperty } from '@nestjs/swagger';
import { JsonValue } from '@prisma/client/runtime/library';
import { IsDate, IsDateString, IsNotEmpty, IsNumber } from 'class-validator';

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

  @ApiProperty({
    description: 'Attachments object',
    example: {
      fileName: 'file.png',
      filePath: '/path/to/file.png',
      fileSize: 2000,
      fileType: 'image/png',
    },
  })
  attachment?: JsonValue;
}
