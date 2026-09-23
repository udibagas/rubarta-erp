import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Res,
  ParseIntPipe,
  StreamableFile,
} from '@nestjs/common';
import { Response } from 'express';
import { InvoicesService } from './invoices.service';
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  QueryInvoiceDto,
  SendInvoiceEmailDto,
} from './invoice.dto';
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
  findAll(@Query() query: QueryInvoiceDto) {
    return this.invoicesService.findAll(query);
  }

  @Get('summary')
  getSummary(
    @Query('customerId', new ParseIntPipe({ optional: true }))
    customerId?: number,
    @Query('status') status?: InvoiceStatus,
  ) {
    return this.invoicesService.getTotalAmount(customerId, status);
  }

  @Get('export/pdf')
  async exportPdf(
    @Res({ passthrough: true }) res: Response,
    @Query() query: QueryInvoiceDto,
  ) {
    const buffer = await this.invoicesService.exportToPdf(query);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="invoices.pdf"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  @Get('export/excel')
  async exportExcel(
    @Res({ passthrough: true }) res: Response,
    @Query() query: QueryInvoiceDto,
  ) {
    const buffer = await this.invoicesService.exportToExcel(query);

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="invoices-${new Date().toISOString().split('T')[0]}.xlsx"`,
    });

    return new StreamableFile(buffer);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.invoicesService.findOne(id);
  }

  @Get(':id/preview')
  async preview(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const pdfBuffer = await this.invoicesService.preview(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="invoice-${id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  @Post(':id/send')
  send(
    @Param('id', ParseIntPipe) id: number,
    @Body() sendInvoiceEmailDto: SendInvoiceEmailDto,
  ) {
    return this.invoicesService.send(id, sendInvoiceEmailDto);
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
