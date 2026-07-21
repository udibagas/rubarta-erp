import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsOptional,
  IsEnum,
  IsDateString,
  MaxLength,
  IsBoolean,
  IsArray,
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

  @ApiProperty({
    required: false,
    example: {
      fileName: 'document.pdf',
      filePath: '/uploads/2025/01/document.pdf',
      fileSize: 102400,
      fileType: 'application/pdf',
    },
    description: 'File metadata (name, path, size, type)',
  })
  @IsOptional()
  @IsArray()
  attachments?: Record<string, any>[];
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

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isPaginated?: boolean;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @IsInt()
  page?: number;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @IsInt()
  limit?: number;
}
