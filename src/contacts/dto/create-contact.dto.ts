import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateContactDto {
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @IsEmail({}, { message: 'Invalid email' })
  @IsOptional()
  email?: string;

  @IsNotEmpty({ message: 'Phone number is required' })
  phone: string;

  @IsOptional()
  position?: string;

  @IsOptional()
  notes?: string;

  @IsNotEmpty({ message: 'Customer is required' })
  customerId: number;
}
