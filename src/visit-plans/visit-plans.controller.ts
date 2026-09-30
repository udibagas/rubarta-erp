import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { Response } from 'express';
import { VisitPlansService } from './visit-plans.service';
import {
  CreateVisitPlanDto,
  QueryVisitPlanDto,
  UpdateVisitPlanDto,
} from './visit-plan.dto';
import { Auth } from '../auth/auth.decorator';
import { User } from '../prisma/client/client';

@Controller('api/visit-plans')
export class VisitPlansController {
  constructor(private readonly visitPlansService: VisitPlansService) {}

  @Post()
  create(@Body() data: CreateVisitPlanDto, @Auth() user: User) {
    return this.visitPlansService.create({ ...data, userId: user.id });
  }

  @Get()
  findAll(@Query() query: QueryVisitPlanDto) {
    return this.visitPlansService.findAll(query);
  }

  @Get('export/pdf')
  async exportPdf(
    @Res({ passthrough: true }) res: Response,
    @Query() query: QueryVisitPlanDto,
  ) {
    const buffer = await this.visitPlansService.exportToPdf(query);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="visit-plans.pdf"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  @Get('export/excel')
  async exportExcel(
    @Res({ passthrough: true }) res: Response,
    @Query() query: QueryVisitPlanDto,
  ) {
    const buffer = await this.visitPlansService.exportToExcel(query);

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="visit-plans-${new Date().toISOString().split('T')[0]}.xlsx"`,
    });

    return new StreamableFile(buffer);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.visitPlansService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateVisitPlanDto,
  ) {
    return this.visitPlansService.update(id, data);
  }

  @Post(':id/complete')
  complete(
    @Param('id', ParseIntPipe) id: number,
    @Body('outcome') outcome?: string,
  ) {
    return this.visitPlansService.complete(id, outcome);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.visitPlansService.remove(id);
  }
}
