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
import { DepartmentsService } from './departments.service';
import { DepartmentDto } from './department.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/role.decorator';
import { Role } from '@prisma/client';
import { Department } from './department.entity';

@Controller('api/departments')
@ApiTags('Departments')
@ApiBearerAuth()
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create new department' })
  @ApiCreatedResponse({ type: Department })
  create(@Body() departmentDto: DepartmentDto): Promise<Department> {
    return this.departmentsService.create(departmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all department' })
  @ApiOkResponse({ type: Department, isArray: true })
  findAll(): Promise<Department[]> {
    return this.departmentsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single department by id' })
  @ApiOkResponse({ type: Department })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Department> {
    return this.departmentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update department by id' })
  @ApiOkResponse({ type: Department })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() departmentDto: DepartmentDto,
  ): Promise<Department> {
    return this.departmentsService.update(id, departmentDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete department by id' })
  @ApiOkResponse({ type: Department })
  remove(@Param('id', ParseIntPipe) id: number): Promise<Department> {
    return this.departmentsService.remove(id);
  }
}
