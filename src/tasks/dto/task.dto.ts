import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsOptional,
  IsEnum,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { TaskStatus, TaskPriority } from '../../prisma/client/client';

export class CreateTaskDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  userId: number;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @IsInt()
  leadId?: number;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @IsInt()
  opportunityId?: number;

  @ApiProperty({ example: 'Follow up with lead' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({
    required: false,
    example: 'Call customer to discuss requirements',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '2025-06-01T10:00:00Z' })
  @IsDateString()
  dueDate: string;

  @ApiProperty({
    enum: TaskPriority,
    example: TaskPriority.Medium,
    default: TaskPriority.Medium,
  })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiProperty({
    enum: TaskStatus,
    example: TaskStatus.Todo,
    default: TaskStatus.Todo,
  })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;
}

export class UpdateTaskDto extends PartialType(CreateTaskDto) {}

export class QueryTaskDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  userId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  leadId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  opportunityId?: number;

  @ApiProperty({ required: false, enum: TaskStatus })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiProperty({ required: false, enum: TaskPriority })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  keyword?: string;
}
