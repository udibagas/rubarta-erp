import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  SerializeOptions,
} from '@nestjs/common';
import { Auth } from '../auth/auth.decorator';
import { User } from '../prisma/client/client';
import { CreateFiscalPeriodDto } from './fiscal-periods.dto';
import { FiscalPeriodsService } from './fiscal-periods.service';
import { FiscalPeriod } from './fiscal-period.entity';

@Controller('api/accounting/periods')
export class FiscalPeriodsController {
  constructor(private readonly service: FiscalPeriodsService) {}

  @Post()
  @SerializeOptions({ type: FiscalPeriod })
  create(@Body() data: CreateFiscalPeriodDto, @Auth() _user: User) {
    return this.service.create(data);
  }

  @Get()
  @SerializeOptions({ type: FiscalPeriod })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @SerializeOptions({ type: FiscalPeriod })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post(':id/close')
  @SerializeOptions({ type: FiscalPeriod })
  close(@Param('id', ParseIntPipe) id: number, @Auth() user: User) {
    return this.service.close(id, user.id);
  }
}
