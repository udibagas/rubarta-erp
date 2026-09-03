import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ApprovalActionDto {
  @ApiProperty({ required: false, description: 'Remarks / notes' })
  @IsOptional()
  @IsString()
  remarks?: string;
}
