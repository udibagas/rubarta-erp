import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { BanksService } from './banks.service';
import { CreateBankDto } from './dto/create-bank.dto';
import { UpdateBankDto } from './dto/update-bank.dto';
import { ApiBearerAuth, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { Bank } from './entities/bank.entity';

@ApiTags('Banks')
@ApiBearerAuth()
@Controller('api/banks')
export class BanksController {
  constructor(private readonly banksService: BanksService) {}

  @Post()
  @ApiCreatedResponse({ type: Bank })
  create(@Body() createBankDto: CreateBankDto): Promise<Bank> {
    return this.banksService.create(createBankDto);
  }

  @Get()
  findAll(): Promise<Bank[]> {
    return this.banksService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Bank> {
    return this.banksService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateBankDto: UpdateBankDto,
  ): Promise<Bank> {
    return this.banksService.update(+id, updateBankDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<Bank> {
    return this.banksService.remove(+id);
  }
}
