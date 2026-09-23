import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
  Req,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Response, Request } from 'express';
import { Auth } from '../auth/auth.decorator';
import { User } from '../prisma/client/client';
import { PurchaseOrdersService } from './purchase-orders.service';
import {
  CreatePurchaseOrderDto,
  QueryPurchaseOrderDto,
  SendPurchaseOrderEmailDto,
  UpdatePurchaseOrderDto,
} from './purchase-order.dto';

@ApiTags('Purchase Orders')
@ApiBearerAuth()
@Controller('api/purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create new purchase order' })
  @ApiCreatedResponse({ description: 'Purchase order created' })
  create(
    @Body() dto: CreatePurchaseOrderDto,
    @Auth() user: User,
    @Req() req: Request,
  ) {
    return this.purchaseOrdersService.create({
      ...dto,
      companyId: dto.companyId ?? Number(req.cookies.companyId),
      userId: user.id,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all purchase orders' })
  @ApiOkResponse({ description: 'List of purchase orders' })
  findAll(@Query() query: QueryPurchaseOrderDto) {
    return this.purchaseOrdersService.findAll(query);
  }

  @Get('export/pdf')
  @ApiOperation({ summary: 'Export purchase orders to PDF' })
  @ApiOkResponse({ description: 'Purchase orders PDF download' })
  async exportPdf(
    @Res({ passthrough: true }) res: Response,
    @Query() query: QueryPurchaseOrderDto,
  ) {
    const buffer = await this.purchaseOrdersService.exportToPdf(query);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="purchase-orders.pdf"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  @Get('export/excel')
  @ApiOperation({ summary: 'Export purchase orders to Excel' })
  @ApiOkResponse({ description: 'Purchase orders Excel download' })
  async exportExcel(
    @Res({ passthrough: true }) res: Response,
    @Query() query: QueryPurchaseOrderDto,
  ) {
    const buffer = await this.purchaseOrdersService.exportToExcel(query);

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="purchase-orders-${new Date().toISOString().split('T')[0]}.xlsx"`,
    });

    return new StreamableFile(buffer);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get purchase order by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.purchaseOrdersService.findOne(id);
  }

  @Get(':id/preview')
  @ApiOperation({ summary: 'Preview purchase order PDF' })
  async preview(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const pdfBuffer = await this.purchaseOrdersService.preview(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="purchase-order-${id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update purchase order' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePurchaseOrderDto,
  ) {
    return this.purchaseOrdersService.update(id, dto);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit purchase order for approval' })
  submit(@Param('id', ParseIntPipe) id: number) {
    return this.purchaseOrdersService.submit(id);
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Send purchase order by email with PDF attached' })
  send(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SendPurchaseOrderEmailDto,
  ) {
    return this.purchaseOrdersService.send(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete purchase order (soft delete)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.purchaseOrdersService.remove(id);
  }
}
