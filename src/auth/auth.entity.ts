import { ApiPropertyOptional } from '@nestjs/swagger';

export class AuthEntity {
  @ApiPropertyOptional()
  token?: string;

  @ApiPropertyOptional()
  user?: { id: number; name: string; email: string; roles: string[] };

  @ApiPropertyOptional({
    description: 'True when a code was emailed and must be verified',
  })
  twoFactorRequired?: boolean;

  @ApiPropertyOptional()
  challengeId?: string;
}
