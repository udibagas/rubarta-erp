import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';

export class VerifyTwoFactorDto {
  @ApiProperty()
  @IsUUID()
  challengeId: string;

  @ApiProperty({ example: '123456' })
  @Matches(/^\d{6}$/, { message: 'Code must be 6 digits' })
  code: string;
}

export class ToggleTwoFactorDto {
  @ApiProperty()
  @IsBoolean()
  enabled: boolean;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;
}
