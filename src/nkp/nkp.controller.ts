import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Query,
  Res,
} from '@nestjs/common';
import { NkpService } from './nkp.service';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CloseNkpDto, NkpDto, QueryNkpDto } from './nkp.dto';
import { Auth } from '../auth/auth.decorator';
import { Role, User } from '../prisma/client/client';
import { formatDate, formatDateNumeric } from '../helpers/date';
import { Response } from 'express';
import { generateNkpPdf } from './nkp-pdf';
import { terbilang, toCurrency, toDecimal } from '../helpers/number';

@ApiTags('Nota Kuasa Pembayaran')
@ApiBearerAuth()
@Controller('api/nkp')
export class NkpController {
  constructor(private readonly nkpService: NkpService) {}

  @Post()
  @ApiOperation({ summary: 'Create new NKP' })
  create(@Body() data: NkpDto, @Auth() user: User) {
    return this.nkpService.create({
      ...data,
      requesterId: user.id,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all NKP' })
  async findAll(
    @Auth() user: User & { Role: Role },
    @Query() query: QueryNkpDto,
  ) {
    return this.nkpService.findAll({ ...query, user });
  }

  @Get('download/pdf')
  @ApiOperation({ summary: 'Download NKP report as PDF' })
  async downloadPdf(
    @Res() res: Response,
    @Auth() user: User & { Role: Role },
    @Query() query: QueryNkpDto,
  ) {
    const buffer = await this.nkpService.exportReportToPdf({ ...query, user });
    const filename = `NKP_Report_${formatDateNumeric(new Date())}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    return res.send(buffer);
  }

  @Get('download/excel')
  @ApiOperation({ summary: 'Download NKP report as Excel' })
  async downloadExcel(
    @Res() res: Response,
    @Auth() user: User & { Role: Role },
    @Query() query: QueryNkpDto,
  ) {
    const buffer = await this.nkpService.exportReportToExcel({
      ...query,
      user,
    });
    const filename = `NKP_Report_${formatDateNumeric(new Date())}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(buffer);
  }

  @Get('get-by-number')
  @ApiOperation({ summary: 'Get NKP by number' })
  findOneByNumber(@Query('number') number: string) {
    return this.nkpService.findOne(number);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get NKP by id' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.nkpService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update NKP by id' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: NkpDto,
    @Auth() user: User,
  ) {
    return this.nkpService.update(id, data, user);
  }

  @Post('submit/:id')
  @ApiOperation({ summary: 'Submit data' })
  @HttpCode(HttpStatus.OK)
  submit(@Param('id', ParseIntPipe) id: number, @Auth() user: User) {
    return this.nkpService.submit(id, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete NKP by id' })
  remove(@Param('id', ParseIntPipe) id: number, @Auth() user: User) {
    return this.nkpService.remove(id, user);
  }

  @Delete(':id/:itemId')
  @ApiOperation({ summary: 'Delete NKP item by id' })
  removeItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Auth() user: User,
  ) {
    return this.nkpService.removeItem(id, itemId, user);
  }

  @Post('approve/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve NKP item by id' })
  approve(
    @Param('id', ParseIntPipe) id: number,
    @Auth() user: User,
    @Body('note') note: string,
  ) {
    return this.nkpService.approve(id, user.id, note);
  }

  @Post('close/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Close NKP item by id' })
  close(
    @Param('id', ParseIntPipe) id: number,
    @Auth() user: User,
    @Body() data: CloseNkpDto,
  ) {
    return this.nkpService.close(id, data, user);
  }

  @Get('getDownPayment/:id')
  getDownPayment(@Param('id', ParseIntPipe) id: number) {
    return this.nkpService.getDownPayment(id);
  }

  @Get('/print/:id')
  async print(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const data = await this.nkpService.findOne(id);
    // const buffer = await generateNkpPdf(data);
    // const filename = `${data.number || 'NKP'}.pdf`;

    // res.setHeader('Content-Type', 'application/pdf');
    // res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    // res.send(buffer);

    const actions = {
      APPROVAL: 'APPROVED BY',
      VERIFICATION: 'VERIFIED BY',
      AUTHORIZATION: 'AUTHORIZED BY',
    };

    res.render('nkp/show', {
      data,
      toCurrency,
      formatDate,
      formatDateNumeric,
      toDecimal,
      terbilang,
      actions,
    });
  }
}
