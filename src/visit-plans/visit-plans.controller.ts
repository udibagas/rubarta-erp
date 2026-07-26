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
    @Query('companyId') companyId?: number | string | number[] | string[],
    @Query('customerId') customerId?: number | string | number[] | string[],
    @Query('userId') userId?: number | number[] | string | string[],
    @Query('status') status?: VisitPlanStatus | VisitPlanStatus[],
    @Query('visitType') visitType?: VisitType | VisitType[],
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('keyword') keyword?: string,
    @Query('year', new ParseIntPipe({ optional: true })) year?: number,
    @Query('month', new ParseIntPipe({ optional: true })) month?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.visitPlansService.findAll({
      page,
      pageSize,
      keyword,
      year,
      month,
      companyId,
      customerId,
      userId,
      status,
      visitType,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      sortBy,
      sortOrder,
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
