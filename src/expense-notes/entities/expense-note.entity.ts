import { ApiProperty } from '@nestjs/swagger';
import { JsonValue } from '@prisma/client/runtime/library';

export class ExpenseNote {
  @ApiProperty({ description: 'Expense Note ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'User ID', example: 1 })
  userId: number;

  @ApiProperty({ description: 'Date', example: '2024-07-01' })
  date: Date;

  @ApiProperty({ description: 'Expense Type ID', example: 1 })
  expenseTypeId: number;

  @ApiProperty({ description: 'Expense description', example: 'BBM 20 Liter' })
  description: string;

  @ApiProperty({ description: 'Expense amount', example: 200_0000 })
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
