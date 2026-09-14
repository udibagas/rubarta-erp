import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
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
@Controller('api/goods-receipts')
export class GoodsReceiptsController {
  constructor(private readonly goodsReceiptsService: GoodsReceiptsService) {}

  @Post()
  @ApiOperation({ summary: 'Create new good receipt' })
  @ApiCreatedResponse({ description: 'Good receipt created' })
  create(@Body() dto: CreateGoodsReceiptDto, @Auth() user: User) {
    return this.goodsReceiptsService.create({ ...dto, userId: user.id });
  }

  @Post('parse-packing-list')
  @ApiOperation({ summary: 'Parse packing list PDF' })
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
  @ApiOkResponse({ description: 'Parsed packing list items' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
    }),
  )
  parsePackingList(
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
    return this.goodsReceiptsService.parsePackingList(file.buffer);
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
