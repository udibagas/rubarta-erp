import { Transform } from 'class-transformer';
import { IsDate, IsString, MinLength } from 'class-validator';

export class CreateFiscalPeriodDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsDate({ message: 'Invalid date' })
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  startDate: Date;

  @IsDate({ message: 'Invalid date' })
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  endDate: Date;
}
