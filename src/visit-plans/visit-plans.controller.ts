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
} from '@nestjs/common';
import { VisitPlansService } from './visit-plans.service';
import { CreateVisitPlanDto } from './dto/create-visit-plan.dto';
import { UpdateVisitPlanDto } from './dto/update-visit-plan.dto';
import { Auth } from '../auth/auth.decorator';
import { User, VisitPlanStatus, VisitType } from '../prisma/client/client';

@Controller('api/visit-plans')
export class VisitPlansController {
  constructor(private readonly visitPlansService: VisitPlansService) {}

  @Post()
  create(@Body() data: CreateVisitPlanDto, @Auth() user: User) {
    return this.visitPlansService.create({ ...data, userId: user.id });
  }

  @Get()
  findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('pageSize', new ParseIntPipe({ optional: true })) pageSize?: number,
    @Query('companyId', new ParseIntPipe({ optional: true })) companyId?: number,
    @Query('customerId', new ParseIntPipe({ optional: true })) customerId?: number,
    @Query('contactId', new ParseIntPipe({ optional: true })) contactId?: number,
    @Query('userId', new ParseIntPipe({ optional: true })) userId?: number,
    @Query('status') status?: VisitPlanStatus,
    @Query('visitType') visitType?: VisitType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('keyword') keyword?: string,
    @Query('year', new ParseIntPipe({ optional: true })) year?: number,
    @Query('month', new ParseIntPipe({ optional: true })) month?: number,
  ) {
    return this.visitPlansService.findAll({
      page,
      pageSize,
      keyword,
      year,
      month,
      companyId,
      customerId,
      contactId,
      userId,
      status,
      visitType,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
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
