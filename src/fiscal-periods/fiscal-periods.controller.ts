import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { Auth } from '../auth/auth.decorator';
import { User } from '../prisma/client/client';
import { CreateFiscalPeriodDto } from './fiscal-periods.dto';
import { FiscalPeriodsService } from './fiscal-periods.service';

@Controller('api/accounting/periods')
export class FiscalPeriodsController {
  constructor(private readonly service: FiscalPeriodsService) {}

  @Post()
  create(@Body() data: CreateFiscalPeriodDto, @Auth() _user: User) {
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

  @Post(':id/close')
  close(@Param('id', ParseIntPipe) id: number, @Auth() user: User) {
    return this.service.close(id, user.id);
  }
}
