import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, Length } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  // @ApiProperty({
  //   example: 'secret123',
  // })
  // @Length(8, undefined, { message: 'Minimum password 8 is characters' })
  // @IsOptional()
  // password?: string;
}
