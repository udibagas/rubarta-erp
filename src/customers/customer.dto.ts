import { IsString } from 'class-validator';

export class CustomerDto {
  @IsString()
  readonly name: string;

  @IsString()
  readonly address: string;

  @IsString()
  readonly phone: string;

  @IsString()
  readonly email: string;
}
