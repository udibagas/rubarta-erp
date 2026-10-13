import { Transform, Type } from 'class-transformer';
import { IsDate, IsString, MinLength } from 'class-validator';

export class CreateFiscalPeriodDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsDate({ message: 'Invalid date' })
  @Type(() => Date)
  startDate: Date;

  @IsDate({ message: 'Invalid date' })
  @Type(() => Date)
  endDate: Date;
}
