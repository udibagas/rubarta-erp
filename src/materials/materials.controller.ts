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
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
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
  ) {
    return this.materialsService.findAll({
      keyword,
      category,
      supplierId,
      isActive,
      lowStock,
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
}
