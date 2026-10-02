import { IsDateString, IsString, MinLength } from 'class-validator';

export class CreateFiscalPeriodDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}
