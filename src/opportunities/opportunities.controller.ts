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
import { OpportunitiesService } from './opportunities.service';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import { Auth } from 'src/auth/auth.decorator';
import { User } from '@prisma/client';

@Controller('api/opportunities')
export class OpportunitiesController {
  constructor(private readonly opportunitiesService: OpportunitiesService) {}

  @Post()
  create(@Body() data: CreateOpportunityDto, @Auth() user: User) {
    return this.opportunitiesService.create({ ...data, userId: user.id });
  }

  @Get()
  findAll(
    @Query('page', ParseIntPipe) page: number,
    @Query('pageSize', ParseIntPipe) pageSize: number,
    @Query('companyId', ParseIntPipe) companyId: number,
    @Query('keyword') keyword: string,
  ) {
    return this.opportunitiesService.findAll({
      page,
      pageSize,
      companyId,
      keyword,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.opportunitiesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateOpportunityDto,
  ) {
    return this.opportunitiesService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.opportunitiesService.remove(id);
  }
}
