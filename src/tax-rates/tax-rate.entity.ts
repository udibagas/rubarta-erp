import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Account } from '../accounts/entities/account.entity';
import { TaxType } from '../prisma/client/client';

export class TaxRate {
  @ApiProperty()
  id: number;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: Number })
  @Type(() => Number)
  rate: number;

  @ApiProperty({ enum: TaxType })
  type: TaxType;

  @ApiProperty()
  accountId: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;

  @ApiPropertyOptional({ type: () => Account })
  @Type(() => Account)
  account?: Account;
}
