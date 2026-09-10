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
  ParseEnumPipe,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  UploadedFile,
  UseInterceptors,
  Res,
} from '@nestjs/common';
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
import { CreateSalesOrderDto, UpdateSalesOrderDto } from './sales-order.dto';
import { SalesOrderStatus, User } from '../prisma/client/client';
import { Public } from '../auth/public.decorator';
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
  create(@Body() createOrderDto: CreateSalesOrderDto, @Auth() user: User) {
    return this.salesOrdersService.create({
      ...createOrderDto,
      userId: user.id,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders' })
  @ApiOkResponse({ description: 'List of orders' })
  findAll(
    @Query('keyword') keyword?: string,
    @Query('customerId', new ParseIntPipe({ optional: true }))
    customerId?: number,
    @Query('status', new ParseEnumPipe(SalesOrderStatus, { optional: true }))
    status?: SalesOrderStatus,
  ) {
    return this.salesOrdersService.findAll({ keyword, customerId, status });
  }

  @Public()
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
