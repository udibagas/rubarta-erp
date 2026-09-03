import { ApiProperty } from '@nestjs/swagger';
import { ApprovalStatus, ApprovalType } from '../prisma/client/client';

export class ApprovalItem {
  @ApiProperty()
  id: number;

  @ApiProperty()
  approvalId: number;

  @ApiProperty()
  order: number;

  @ApiProperty()
  userId: number;

  @ApiProperty({ enum: ApprovalStatus, nullable: true })
  status: ApprovalStatus | null;

  @ApiProperty({ nullable: true })
  remarks?: string | null;
}

export class Approval {
  @ApiProperty()
  id: number;

  @ApiProperty({ enum: ApprovalType })
  approvalType: ApprovalType;

  @ApiProperty()
  moduleId: number;

  @ApiProperty({ enum: ApprovalStatus, nullable: true })
  status: ApprovalStatus | null;

  @ApiProperty({ type: [ApprovalItem] })
  items?: ApprovalItem[];
}
