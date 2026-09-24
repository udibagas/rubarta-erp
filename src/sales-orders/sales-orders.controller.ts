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
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  UploadedFile,
  UseInterceptors,
  Res,
  Req,
  StreamableFile,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { SalesOrdersService } from './sales-orders.service';
import {
  CreateSalesOrderDto,
  QuerySalesOrderDto,
  SendSalesOrderEmailDto,
  UpdateSalesOrderDto,
} from './sales-order.dto';
import { User } from '../prisma/client/client';
import { Response } from 'express';
import { Auth } from '../auth/auth.decorator';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('api/sales-orders')
export class SalesOrdersController {
  constructor(private readonly salesOrdersService: SalesOrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create new order' })
  @ApiCreatedResponse({ description: 'Order created' })
  create(
    @Body() dto: CreateSalesOrderDto,
    @Auth() user: User,
    @Req() req: Request,
  ) {
    return this.salesOrdersService.create({
      ...dto,
      companyId: dto.companyId ?? Number(req.cookies.companyId),
      userId: user.id,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders' })
  @ApiOkResponse({ description: 'List of orders' })
  findAll(@Query() query: QuerySalesOrderDto) {
    return this.salesOrdersService.findAll(query);
  }

  @Post('parse-po')
  @ApiOperation({ summary: 'Parse PO PDF' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @ApiOkResponse({ description: 'Parsed PO text' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
    }),
  )
  parsePo(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10000000 }),
          new FileTypeValidator({ fileType: 'application/pdf' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.salesOrdersService.parsePo(file.buffer);
  }

  @Get('export/pdf')
  @ApiOperation({ summary: 'Export sales orders to PDF' })
  @ApiOkResponse({ description: 'Sales orders PDF download' })
  async exportPdf(
    @Res({ passthrough: true }) res: Response,
    @Query() query: QuerySalesOrderDto,
  ) {
    const buffer = await this.salesOrdersService.exportToPdf(query);

    // res.set({
    //   'Content-Type': 'application/pdf',
    //   'Content-Disposition': `attachment; filename="sales-orders-${new Date().toISOString().split('T')[0]}.pdf"`,
    // });

    // return new StreamableFile(buffer);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="sales-orders.pdf"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  @Get('export/excel')
  @ApiOperation({ summary: 'Export sales orders to Excel' })
  @ApiOkResponse({ description: 'Sales orders Excel download' })
  async exportExcel(
    @Res({ passthrough: true }) res: Response,
    @Query() query: QuerySalesOrderDto,
  ) {
    const buffer = await this.salesOrdersService.exportToExcel(query);

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="sales-orders-${new Date().toISOString().split('T')[0]}.xlsx"`,
    });

    return new StreamableFile(buffer);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiOkResponse({ description: 'Order details' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.salesOrdersService.findOne(id);
  }

  @Get(':id/preview')
  @ApiOperation({ summary: 'Preview order PDF' })
  @ApiOkResponse({ description: 'Order PDF' })
  async preview(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const pdfBuffer = await this.salesOrdersService.preview(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="sales-order-${id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  @Post(':id/send')
  @ApiOperation({
    summary: 'Send sales order to customer via email with PDF attached',
  })
  @ApiOkResponse({ description: 'Sales order sent' })
  send(
    @Param('id', ParseIntPipe) id: number,
    @Body() sendSalesOrderEmailDto: SendSalesOrderEmailDto,
  ) {
    return this.salesOrdersService.send(id, sendSalesOrderEmailDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update order' })
  @ApiOkResponse({ description: 'Order updated' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderDto: UpdateSalesOrderDto,
  ) {
    return this.salesOrdersService.update(id, updateOrderDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete order (soft delete)' })
  @ApiOkResponse({ description: 'Order deleted' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.salesOrdersService.remove(id);
  }
}
