import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsNumber,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateExpenseDto {
  @IsDate({ message: 'Invalid date' })
  @Type(() => Date)
  date: Date;

  @IsString()
  @MinLength(1)
  description: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  accountId: number;
}
