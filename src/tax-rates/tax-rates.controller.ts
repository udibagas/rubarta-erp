import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Auth } from '../auth/auth.decorator';
import { User } from '../prisma/client/client';
import { CreateTaxRateDto, UpdateTaxRateDto } from './tax-rates.dto';
import { TaxRatesService } from './tax-rates.service';

@Controller('api/accounting/tax-rates')
export class TaxRatesController {
  constructor(private readonly service: TaxRatesService) {}

  @Post()
  create(@Body() data: CreateTaxRateDto, @Auth() _user: User) {
    return this.service.create(data);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateTaxRateDto,
    @Auth() _user: User,
  ) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Auth() _user: User) {
    return this.service.remove(id);
  }
}
