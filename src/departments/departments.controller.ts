import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from 'src/auth/role.decorator';
import { Role } from '@prisma/client';
import { Department } from './entities/department.entity';

@Controller('api/departments')
@ApiTags('Departments')
@ApiBearerAuth()
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiCreatedResponse({ type: Department })
  create(
    @Body() createDepartmentDto: CreateDepartmentDto,
  ): Promise<Department> {
    return this.departmentsService.create(createDepartmentDto);
  }

  @Get()
  @ApiOkResponse({ type: Department, isArray: true })
  findAll(): Promise<Department[]> {
    return this.departmentsService.findAll();
  }

  @Get(':id')
  @ApiOkResponse({ type: Department })
  findOne(@Param('id') id: string): Promise<Department> {
    return this.departmentsService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOkResponse({ type: Department })
  update(
    @Param('id') id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ): Promise<Department> {
    return this.departmentsService.update(+id, updateDepartmentDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOkResponse({ type: Department })
  remove(@Param('id') id: string): Promise<Department> {
    return this.departmentsService.remove(+id);
  }
}
