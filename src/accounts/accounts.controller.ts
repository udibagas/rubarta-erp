import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  SerializeOptions,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { ParseIntPipe } from '@nestjs/common';
import { Auth } from '../auth/auth.decorator';
import { Account } from './entities/account.entity';

@Controller('api/accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @SerializeOptions({ type: Account })
  create(@Body() createAccountDto: CreateAccountDto, @Auth() _user: unknown) {
    return this.accountsService.create(createAccountDto);
  }

  @Get()
  @SerializeOptions({ type: Account })
  findAll() {
    return this.accountsService.findAll();
  }

  @Get(':id')
  @SerializeOptions({ type: Account })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.accountsService.findOne(id);
  }

  @Patch(':id')
  @SerializeOptions({ type: Account })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAccountDto: UpdateAccountDto,
    @Auth() _user: unknown,
  ) {
    return this.accountsService.update(id, updateAccountDto);
  }

  @Delete(':id')
  @SerializeOptions({ type: Account })
  remove(@Param('id', ParseIntPipe) id: number, @Auth() _user: unknown) {
    return this.accountsService.remove(id);
  }
}
