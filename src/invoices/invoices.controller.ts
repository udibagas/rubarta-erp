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
  InvoiceStatusUpdateDto,
} from './invoice.dto';
import { Auth } from '../auth/auth.decorator';
import { User, InvoiceStatus } from '../prisma/client/client';

@Controller('api/invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  create(@Body() data: CreateInvoiceDto, @Auth() user: User) {
    return this.invoicesService.create({ ...data, userId: user.id }, user);
  }

  @Get()
  findAll(@Query() query: QueryInvoiceDto, @Auth() user: User) {
    return this.invoicesService.findAll(query, user);
  }

  @Get('summary')
  getSummary(
    @Query('customerId', new ParseIntPipe({ optional: true }))
    @Auth()
    user: User,
    customerId?: number,
    @Query('status') status?: InvoiceStatus,
  ) {
    return this.invoicesService.getTotalAmount(customerId, status, user);
  }

  @Get('export/pdf')
  async exportPdf(
    @Res({ passthrough: true }) res: Response,
    @Query() query: QueryInvoiceDto,
    @Auth() user: User,
  ) {
    const buffer = await this.invoicesService.exportToPdf(query, user);

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
    @Auth() user: User,
  ) {
    const buffer = await this.invoicesService.exportToExcel(query, user);

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="invoices-${new Date().toISOString().split('T')[0]}.xlsx"`,
    });

    return new StreamableFile(buffer);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Auth() user: User) {
    return this.invoicesService.findOne(id, user);
  }

  @Get(':id/preview')
  async preview(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
    @Auth() user: User,
  ) {
    const invoice = await this.invoicesService.findOne(id, user);
    const filename = `${invoice.number}_${invoice.referenceNumber}.pdf`;
    const pdfBuffer = await this.invoicesService.preview(id, user);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  @Post(':id/send')
  send(
    @Param('id', ParseIntPipe) id: number,
    @Body() sendInvoiceEmailDto: SendInvoiceEmailDto,
    @Auth() user: User,
  ) {
    return this.invoicesService.send(id, sendInvoiceEmailDto, user);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateInvoiceDto,
    @Auth() user: User,
  ) {
    return this.invoicesService.update(id, data, user);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() statusUpdateDto: InvoiceStatusUpdateDto,
    @Auth() user: User,
  ) {
    return this.invoicesService.updateStatus(id, statusUpdateDto, user);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Auth() user: User) {
    return this.invoicesService.remove(id, user);
  }
}
