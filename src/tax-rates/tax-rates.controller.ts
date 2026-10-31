import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  SerializeOptions,
} from '@nestjs/common';
import { Auth } from '../auth/auth.decorator';
import { User } from '../prisma/client/client';
import { CreateTaxRateDto, UpdateTaxRateDto } from './tax-rates.dto';
import { TaxRatesService } from './tax-rates.service';
import { TaxRate } from './tax-rate.entity';

@Controller('api/accounting/tax-rates')
export class TaxRatesController {
  constructor(private readonly service: TaxRatesService) {}

  @Post()
  @SerializeOptions({ type: TaxRate })
  create(@Body() data: CreateTaxRateDto, @Auth() _user: User) {
    return this.service.create(data);
  }

  @Get()
  @SerializeOptions({ type: TaxRate })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @SerializeOptions({ type: TaxRate })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @SerializeOptions({ type: TaxRate })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateTaxRateDto,
    @Auth() _user: User,
  ) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @SerializeOptions({ type: TaxRate })
  remove(@Param('id', ParseIntPipe) id: number, @Auth() _user: User) {
    return this.service.remove(id);
  }
}
