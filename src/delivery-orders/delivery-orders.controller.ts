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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
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

  @Patch(':id')
  @ApiOperation({ summary: 'Update delivery order' })
  @ApiOkResponse({ description: 'Delivery order updated' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDeliveryOrderDto,
  ) {
    return this.deliveryOrdersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete delivery order' })
  @ApiOkResponse({ description: 'Delivery order deleted' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.deliveryOrdersService.remove(id);
  }
}
