import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Patch,
  Query,
} from '@nestjs/common';
import { Customer } from '@prisma/client';
import { CustomersService } from './customers.service';
import { CustomerDto } from './customer.dto';

@Controller('api/customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  async findAll(@Query('keyword') keyword: string): Promise<Customer[]> {
    return this.customersService.findAll({ keyword });
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Customer> {
    return this.customersService.findOne(id);
  }

  @Post()
  async create(@Body() customerDto: CustomerDto): Promise<Customer> {
    return this.customersService.create(customerDto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() customerDto: CustomerDto,
  ): Promise<Customer> {
    return this.customersService.update(id, customerDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: number): Promise<Customer> {
    return this.customersService.remove(id);
  }
}
