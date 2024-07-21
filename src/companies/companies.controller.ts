import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompanyDto } from './company.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/role.decorator';
import { Role } from '@prisma/client';
import { Company } from './company.entity';

@ApiTags('Companies')
@ApiBearerAuth()
@Controller('api/companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create new company' })
  @ApiCreatedResponse({ type: Company })
  create(@Body() companyDto: CompanyDto): Promise<Company> {
    return this.companiesService.create(companyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all companies' })
  @ApiOkResponse({ type: Company, isArray: true })
  findAll(): Promise<Company[]> {
    return this.companiesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single company by id' })
  @ApiOkResponse({ type: Company })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Company> {
    return this.companiesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update company by id' })
  @ApiOkResponse({ type: Company })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() companyDto: CompanyDto,
  ): Promise<Company> {
    return this.companiesService.update(id, companyDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete company by id' })
  @ApiOkResponse({ type: Company })
  remove(@Param('id', ParseIntPipe) id: number): Promise<Company> {
    return this.companiesService.remove(id);
  }
}
