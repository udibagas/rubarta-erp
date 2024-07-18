import { ApiProperty } from '@nestjs/swagger';
import { JsonValue } from '@prisma/client/runtime/library';
import { IsDate, IsNotEmpty, IsNumber } from 'class-validator';

export class ExpenseNoteDto {
  @ApiProperty({ description: 'User ID', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({ description: 'Date', example: '2024-07-01' })
  @IsDate()
  @IsNotEmpty()
  date: Date;

  @ApiProperty({ description: 'Expense Type ID', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  expenseTypeId: number;

  @ApiProperty({ description: 'Expense description', example: 'BBM 20 Liter' })
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Expense amount', example: 200_0000 })
  @IsNumber()
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
