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
import { GoodsReceiptsService } from './goods-receipts.service';
import {
  CreateGoodsReceiptDto,
  QueryGoodsReceiptDto,
  UpdateGoodsReceiptDto,
} from './goods-receipt.dto';
import { Auth } from '../auth/auth.decorator';
import { User } from '../prisma/client/client';

@ApiTags('Good Receipts')
@ApiBearerAuth()
@Controller('api/good-receipts')
export class GoodsReceiptsController {
  constructor(private readonly goodsReceiptsService: GoodsReceiptsService) {}

  @Post()
  @ApiOperation({ summary: 'Create new good receipt' })
  @ApiCreatedResponse({ description: 'Good receipt created' })
  create(@Body() dto: CreateGoodsReceiptDto, @Auth() user: User) {
    return this.goodsReceiptsService.create({ ...dto, userId: user.id });
  }

  @Get()
  @ApiOperation({ summary: 'Get all good receipts' })
  @ApiOkResponse({ description: 'List of good receipts' })
  findAll(@Query() query: QueryGoodsReceiptDto) {
    return this.goodsReceiptsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get good receipt by ID' })
  @ApiOkResponse({ description: 'Good receipt details' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.goodsReceiptsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update good receipt' })
  @ApiOkResponse({ description: 'Good receipt updated' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGoodsReceiptDto,
  ) {
    return this.goodsReceiptsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete good receipt' })
  @ApiOkResponse({ description: 'Good receipt deleted' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.goodsReceiptsService.remove(id);
  }
}
