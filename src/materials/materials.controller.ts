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
  ParseBoolPipe,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Res,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as multer from 'multer';
import { MaterialsService } from './materials.service';
import { CreateMaterialDto, UpdateMaterialDto } from './dto/material.dto';

@ApiTags('Materials')
@ApiBearerAuth()
@Controller('api/materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Post()
  @ApiOperation({ summary: 'Create new material' })
  @ApiCreatedResponse({ description: 'Material created' })
  create(@Body() createMaterialDto: CreateMaterialDto) {
    return this.materialsService.create(createMaterialDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all materials' })
  @ApiOkResponse({ description: 'List of materials' })
  findAll(
    @Query('keyword') keyword?: string,
    @Query('category') category?: string,
    @Query('supplierId', new ParseIntPipe({ optional: true }))
    supplierId?: number,
    @Query('isActive', new ParseBoolPipe({ optional: true }))
    isActive?: boolean,
    @Query('lowStock', new ParseBoolPipe({ optional: true }))
    lowStock?: boolean,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('pageSize', new ParseIntPipe({ optional: true })) pageSize?: number,
  ) {
    return this.materialsService.findAll({
      keyword,
      category,
      supplierId,
      isActive,
      lowStock,
      page,
      pageSize,
    });
  }

  @Get('part-number/:partNumber')
  @ApiOperation({ summary: 'Get material by part number' })
  @ApiOkResponse({ description: 'Material details' })
  findByPartNumber(@Param('partNumber') partNumber: string) {
    return this.materialsService.findByPartNumber(partNumber);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get material by ID' })
  @ApiOkResponse({ description: 'Material details' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.materialsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update material' })
  @ApiOkResponse({ description: 'Material updated' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMaterialDto: UpdateMaterialDto,
  ) {
    return this.materialsService.update(id, updateMaterialDto);
  }

  @Patch(':id/stock')
  @ApiOperation({ summary: 'Update material stock' })
  @ApiOkResponse({ description: 'Stock updated' })
  updateStock(
    @Param('id', ParseIntPipe) id: number,
    @Body('quantity', ParseIntPipe) quantity: number,
  ) {
    return this.materialsService.updateStock(id, quantity);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete material (soft delete)' })
  @ApiOkResponse({ description: 'Material deleted' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.materialsService.remove(id);
  }

  @Get('export/excel')
  @ApiOperation({ summary: 'Export materials to Excel' })
  @ApiOkResponse({ description: 'Excel file download' })
  async exportToExcel(
    @Res({ passthrough: true }) res: Response,
    @Query('keyword') keyword?: string,
    @Query('category') category?: string,
    @Query('supplierId', new ParseIntPipe({ optional: true }))
    supplierId?: number,
    @Query('isActive', new ParseBoolPipe({ optional: true }))
    isActive?: boolean,
    @Query('lowStock', new ParseBoolPipe({ optional: true }))
    lowStock?: boolean,
  ) {
    const buffer = await this.materialsService.exportToExcel({
      keyword,
      category,
      supplierId,
      isActive,
      lowStock,
    });

    const fileName = `materials_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });

    return new StreamableFile(buffer);
  }

  @Post('import/excel')
  @ApiOperation({ summary: 'Import materials from Excel' })
  @ApiConsumes('multipart/form-data')
  @ApiCreatedResponse({ description: 'Materials imported successfully' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
    }),
  )
  async importFromExcel(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10000000 }), // 10MB
          new FileTypeValidator({
            fileType:
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.materialsService.importFromExcel(file.buffer);
  }

  @Get('export/template')
  @ApiOperation({ summary: 'Download Excel template for import' })
  @ApiOkResponse({ description: 'Excel template file' })
  async downloadTemplate(@Res({ passthrough: true }) res: Response) {
    const buffer = await this.materialsService.generateTemplate();

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="materials_template.xlsx"',
    });

    return new StreamableFile(buffer);
  }
}
