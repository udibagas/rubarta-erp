import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsNotEmpty, IsNumber } from 'class-validator';

export class PaymentAuthorizationItemDto {
  @ApiProperty()
  @IsDate()
  date: Date;

  @ApiProperty()
  @IsNotEmpty()
  description: string;

  @ApiProperty()
  @IsNumber()
  amount: number;
}
