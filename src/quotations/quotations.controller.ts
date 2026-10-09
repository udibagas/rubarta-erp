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
  Req,
  ParseIntPipe,
  StreamableFile,
} from '@nestjs/common';
import { Response, Request } from 'express';
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
} from './quotation.dto';
import { Auth } from '../auth/auth.decorator';
import { QuotationStatus, User } from '../prisma/client/client';

@ApiTags('Quotations')
@ApiBearerAuth()
@Controller('api/quotations')
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create new quotation' })
  @ApiCreatedResponse({ description: 'Quotation created' })
  create(
    @Body() dto: CreateQuotationDto,
    @Auth() user: User,
    @Req() req: Request,
  ) {
    return this.quotationsService.create(
      {
        ...dto,
        companyId: dto.companyId ?? Number(req.cookies.companyId),
        userId: user.id,
      },
      user,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all quotations' })
  @ApiOkResponse({ description: 'List of quotations' })
  findAll(@Query() query: QueryQuotationDto, @Auth() user: User) {
    return this.quotationsService.findAll(query, user);
  }

  @Get('export/pdf')
  @ApiOperation({ summary: 'Export quotations to PDF' })
  @ApiOkResponse({ description: 'Quotations PDF download' })
  async exportPdf(
    @Res({ passthrough: true }) res: Response,
    @Query() query: QueryQuotationDto,
    @Auth() user: User,
  ) {
    const buffer = await this.quotationsService.exportToPdf(query, user);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="quotations.pdf"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  @Get('export/excel')
  @ApiOperation({ summary: 'Export quotations to Excel' })
  @ApiOkResponse({ description: 'Quotations Excel download' })
  async exportExcel(
    @Res({ passthrough: true }) res: Response,
    @Query() query: QueryQuotationDto,
    @Auth() user: User,
  ) {
    const buffer = await this.quotationsService.exportToExcel(query, user);

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="quotations-${new Date().toISOString().split('T')[0]}.xlsx"`,
    });

    return new StreamableFile(buffer);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get quotation by ID' })
  @ApiOkResponse({ description: 'Quotation details' })
  findOne(@Param('id', ParseIntPipe) id: number, @Auth() user: User) {
    return this.quotationsService.findOne(id, user);
  }

  @Get(':id/preview')
  @ApiOperation({ summary: 'Preview quotation PDF' })
  @ApiOkResponse({ description: 'Quotation PDF' })
  async preview(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
    @Auth() user: User,
  ) {
    const quotation = await this.quotationsService.findOne(id, user);
    const pdfBuffer = await this.quotationsService.preview(id, user);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${quotation.number}.pdf"`,
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
    @Auth() user: User,
  ) {
    return this.quotationsService.update(id, updateQuotationDto, user);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update quotation status' })
  @ApiOkResponse({ description: 'Quotation status updated' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: QuotationStatus,
    @Auth() user: User,
  ) {
    return this.quotationsService.updateStatus(id, status, user);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit quotation' })
  @ApiOkResponse({ description: 'Quotation submitted' })
  submit(@Param('id', ParseIntPipe) id: number, @Auth() user: User) {
    return this.quotationsService.submit(id, user);
  }

  @Post(':id/send')
  @ApiOperation({
    summary: 'Send quotation to customer via email with PDF attached',
  })
  @ApiOkResponse({ description: 'Quotation sent' })
  send(
    @Param('id', ParseIntPipe) id: number,
    @Body() sendQuotationEmailDto: SendQuotationEmailDto,
    @Auth() user: User,
  ) {
    return this.quotationsService.send(id, sendQuotationEmailDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete quotation (soft delete)' })
  @ApiOkResponse({ description: 'Quotation deleted' })
  remove(@Param('id', ParseIntPipe) id: number, @Auth() user: User) {
    return this.quotationsService.remove(id, user);
  }
}
