import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { SupplierDto } from './supplier.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Suppliers')
@ApiBearerAuth()
@Controller('api/suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  create(@Body() data: SupplierDto) {
    return this.suppliersService.create(data);
  }

  @Get()
  findAll(@Query('keyword') keyword?: string) {
    return this.suppliersService.findAll({ keyword });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.suppliersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: SupplierDto) {
    return this.suppliersService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.suppliersService.remove(id);
  }
}
