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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { Auth } from '../auth/auth.decorator';
import { User, PurchaseOrderStatus } from '../prisma/client/client';
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
  create(@Body() dto: CreatePurchaseOrderDto, @Auth() user: User) {
    return this.purchaseOrdersService.create({ ...dto, userId: user.id });
  }

  @Get()
  @ApiOperation({ summary: 'Get all purchase orders' })
  @ApiOkResponse({ description: 'List of purchase orders' })
  findAll(
    @Query('keyword') keyword?: string,
    @Query('supplierId', new ParseIntPipe({ optional: true }))
    supplierId?: number,
    @Query('status', new ParseEnumPipe(PurchaseOrderStatus, { optional: true }))
    status?: PurchaseOrderStatus,
  ) {
    return this.purchaseOrdersService.findAll({ keyword, supplierId, status });
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
