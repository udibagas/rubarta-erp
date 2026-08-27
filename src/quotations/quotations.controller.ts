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
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { QuotationsService } from './quotations.service';
import {
  CreateQuotationDto,
  UpdateQuotationDto,
  QueryQuotationDto,
} from './dto/quotation.dto';

@ApiTags('Quotations')
@ApiBearerAuth()
@Controller('api/quotations')
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create new quotation' })
  @ApiCreatedResponse({ description: 'Quotation created' })
  create(@Body() createQuotationDto: CreateQuotationDto) {
    return this.quotationsService.create(createQuotationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all quotations' })
  @ApiOkResponse({ description: 'List of quotations' })
  findAll(@Query() query: QueryQuotationDto) {
    return this.quotationsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get quotation by ID' })
  @ApiOkResponse({ description: 'Quotation details' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.quotationsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update quotation' })
  @ApiOkResponse({ description: 'Quotation updated' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateQuotationDto: UpdateQuotationDto,
  ) {
    return this.quotationsService.update(id, updateQuotationDto);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit quotation' })
  @ApiOkResponse({ description: 'Quotation submitted' })
  submit(@Param('id', ParseIntPipe) id: number) {
    return this.quotationsService.submit(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete quotation (soft delete)' })
  @ApiOkResponse({ description: 'Quotation deleted' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.quotationsService.remove(id);
  }
}
