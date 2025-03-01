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
import { CloseNkpDto, NkpDto } from './nkp.dto';
import { Auth } from '../auth/auth.decorator';
import { PaymentType, User } from '@prisma/client';
// import * as htmlToPdf from 'html-pdf-node';
import { terbilang, toCurrency, toDecimal } from 'src/helpers/number';
import { formatDate, formatDateNumeric } from 'src/helpers/date';
import { Response } from 'express';

@ApiTags('Nota Kuasa Pembayaran')
@ApiBearerAuth()
@Controller('api/nkp')
export class NkpController {
  constructor(private readonly nkpService: NkpService) {}

  @Post()
  @ApiOperation({ summary: 'Create new NKP' })
  @ApiOkResponse({
    description: 'Created payment authorizaton include the items',
    example: {
      id: 1,
      companyId: 1,
      employeeId: 1,
      bankId: 1,
      bankAccount: '2411191***',
      grossAmount: 2000000,
      deduction: 100000,
      netAmount: 1900000,
      amount: 2000000,
      cashAdvance: 0,
      description: 'Cash Advance for Bagas for 3 days',
      parentId: 1,
      status: 'SUBMITTED',
      items: [
        {
          date: '2024-01-02',
          description: 'BBM Pertalite 10 Liter',
          amount: 100000,
        },
      ],
    },
  })
  create(@Body() data: NkpDto, @Auth() user: User) {
    return this.nkpService.create({
      ...data,
      requesterId: user.id,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all NKP' })
  async findAll(
    @Res() res: Response,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
    @Query('companyId', ParseIntPipe) companyId?: number,
    @Query('paymentType') paymentType?: PaymentType,
    @Query('action') action?: string,
    @Query('format') format?: string,
    @Query('dateRange') dateRange?: any,
  ) {
    const data = await this.nkpService.findAll({
      page: Number(page),
      pageSize: Number(pageSize),
      companyId,
      paymentType,
      keyword,
      action,
      format,
      dateRange,
    });

    if (action == 'download' && format == 'pdf') {
      return res.render('nkp/report', {
        data,
        paymentType,
        dateRange,
        formatDateNumeric,
        toDecimal,
      });
    }

    res.json(data);
  }

  @Get('get-by-number')
  @ApiOperation({ summary: 'Get NKP by number' })
  findOneByNumber(@Query('number') number: string) {
    console.log(number);
    return this.nkpService.findOne(number);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get NKP by id' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.nkpService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update NKP by id' })
  update(@Param('id', ParseIntPipe) id: number, @Body() data: NkpDto) {
    return this.nkpService.update(id, data);
  }

  @Post('submit/:id')
  @ApiOperation({ summary: 'Submit data' })
  @HttpCode(HttpStatus.OK)
  submit(@Param('id', ParseIntPipe) id: number, @Auth() user: User) {
    return this.nkpService.submit(id, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete NKP by id' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.nkpService.remove(id);
  }

  @Delete(':id/:itemId')
  @ApiOperation({ summary: 'Delete NKP item by id' })
  removeItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return this.nkpService.removeItem(id, itemId);
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
