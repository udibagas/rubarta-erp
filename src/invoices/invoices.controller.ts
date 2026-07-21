import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { Auth } from '../auth/auth.decorator';
import { User, InvoiceStatus } from '../prisma/client/client';

@Controller('api/invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  create(@Body() data: CreateInvoiceDto, @Auth() user: User) {
    return this.invoicesService.create({ ...data, userId: user.id });
  }

  @Get()
  findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('pageSize', new ParseIntPipe({ optional: true })) pageSize?: number,
    @Query('customerId', new ParseIntPipe({ optional: true }))
    customerId?: number,
    @Query('status') status?: InvoiceStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.invoicesService.findAll({
      page,
      pageSize,
      keyword,
      customerId,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('summary')
  getSummary(
    @Query('customerId', new ParseIntPipe({ optional: true }))
    customerId?: number,
    @Query('status') status?: InvoiceStatus,
  ) {
    return this.invoicesService.getTotalAmount(customerId, status);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.invoicesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateInvoiceDto,
  ) {
    return this.invoicesService.update(id, data);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: InvoiceStatus,
  ) {
    return this.invoicesService.updateStatus(id, status);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.invoicesService.remove(id);
  }
}
