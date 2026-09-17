import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { DeliveryOrdersService } from './delivery-orders.service';
import {
  CreateDeliveryOrderDto,
  QueryDeliveryOrderDto,
  UpdateDeliveryOrderDto,
} from './delivery-order.dto';
import { Auth } from '../auth/auth.decorator';
import { User } from '../prisma/client/client';

@ApiTags('Delivery Orders')
@ApiBearerAuth()
@Controller('api/delivery-orders')
export class DeliveryOrdersController {
  constructor(private readonly deliveryOrdersService: DeliveryOrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create new delivery order' })
  @ApiCreatedResponse({ description: 'Delivery order created' })
  create(@Body() dto: CreateDeliveryOrderDto, @Auth() user: User) {
    return this.deliveryOrdersService.create({ ...dto, userId: user.id });
  }

  @Get()
  @ApiOperation({ summary: 'Get all delivery orders' })
  @ApiOkResponse({ description: 'List of delivery orders' })
  findAll(@Query() query: QueryDeliveryOrderDto) {
    return this.deliveryOrdersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get delivery order by ID' })
  @ApiOkResponse({ description: 'Delivery order details' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.deliveryOrdersService.findOne(id);
  }

  @Get(':id/preview')
  @ApiOperation({ summary: 'Preview delivery order PDF' })
  async preview(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const pdfBuffer = await this.deliveryOrdersService.preview(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="delivery-order-${id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update delivery order' })
  @ApiOkResponse({ description: 'Delivery order updated' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDeliveryOrderDto,
  ) {
    const previousDo = await this.deliveryOrdersService.findOne(id);
    const updatedDo = await this.deliveryOrdersService.update(id, dto);

    // If the delivery order was in Draft status and is now being confirmed,
    // update the delivered quantities of the related sales order items asynchronously.
    if (previousDo.status == 'Draft' && updatedDo.status === 'Confirmed') {
      this.deliveryOrdersService
        .updateSoItemReceivedQuantities(id)
        .then(() => {
          console.log(
            `Successfully updated sales order item delivered quantities for delivery order ID ${id}`,
          );
        })
        .catch((error) => {
          // Handle any errors that occurred during the update
          console.error(error);
        });
    }

    return updatedDo;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete delivery order' })
  @ApiOkResponse({ description: 'Delivery order deleted' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.deliveryOrdersService.remove(id);
  }
}
