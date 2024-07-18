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
import { BanksService } from './banks.service';
import { CreateBankDto } from './dto/create-bank.dto';
import { UpdateBankDto } from './dto/update-bank.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Bank } from './entities/bank.entity';
import { Roles } from '../auth/role.decorator';
import { Role } from '@prisma/client';

@ApiTags('Banks')
@ApiBearerAuth()
@Controller('api/banks')
export class BanksController {
  constructor(private readonly banksService: BanksService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create new bank' })
  @ApiCreatedResponse({ type: Bank })
  create(@Body() createBankDto: CreateBankDto): Promise<Bank> {
    return this.banksService.create(createBankDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all banks' })
  findAll(): Promise<Bank[]> {
    return this.banksService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single bank by id' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Bank> {
    return this.banksService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update bank by id' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBankDto: UpdateBankDto,
  ): Promise<Bank> {
    return this.banksService.update(id, updateBankDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete bank by id' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<Bank> {
    return this.banksService.remove(id);
  }
}
