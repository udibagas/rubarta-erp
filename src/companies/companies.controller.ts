import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto, UpdateCompanyDto } from './company.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/role.decorator';
import { Role } from '../prisma/client/client';
import type { Company } from '../prisma/client/client';
import { Response } from 'express';

@ApiTags('Companies')
@ApiBearerAuth()
@Controller('api/companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create new company' })
  create(@Body() companyDto: CreateCompanyDto): Promise<Company> {
    return this.companiesService.create(companyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all companies' })
  findAll(): Promise<Company[]> {
    return this.companiesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single company by id' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Company> {
    return this.companiesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update company by id' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() companyDto: UpdateCompanyDto,
  ): Promise<Company> {
    return this.companiesService.update(id, companyDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete company by id' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<Company> {
    return this.companiesService.remove(id);
  }

  @Post('set/:id')
  @HttpCode(HttpStatus.OK)
  setCompany(
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.cookie('companyId', id);
    return { message: 'OK' };
  }
}
