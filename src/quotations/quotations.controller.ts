import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Res,
  ParseIntPipe,
} from '@nestjs/common';
import { Response } from 'express';
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
  SendQuotationEmailDto,
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

  @Get(':id/preview')
  @ApiOperation({ summary: 'Preview quotation PDF' })
  @ApiOkResponse({ description: 'Quotation PDF' })
  async preview(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const pdfBuffer = await this.quotationsService.preview(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="quotation-${id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
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

  @Post(':id/send')
  @ApiOperation({
    summary: 'Send quotation to customer via email with PDF attached',
  })
  @ApiOkResponse({ description: 'Quotation sent' })
  send(
    @Param('id', ParseIntPipe) id: number,
    @Body() sendQuotationEmailDto: SendQuotationEmailDto,
  ) {
    return this.quotationsService.send(id, sendQuotationEmailDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete quotation (soft delete)' })
  @ApiOkResponse({ description: 'Quotation deleted' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.quotationsService.remove(id);
  }
}
