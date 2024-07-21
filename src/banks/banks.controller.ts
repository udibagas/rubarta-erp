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
import { BankDto } from './bank.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Bank } from './bank.entity';
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
  create(@Body() bankDto: BankDto): Promise<Bank> {
    return this.banksService.create(bankDto);
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
    @Body() bankDto: BankDto,
  ): Promise<Bank> {
    return this.banksService.update(id, bankDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete bank by id' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<Bank> {
    return this.banksService.remove(id);
  }
}
