import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { Auth } from '../auth/auth.decorator';
import { SettlementStatus, User } from '../prisma/client/client';
import { CreateVendorBillDto, PostVendorBillDto } from './vendor-bills.dto';
import { VendorBillsService } from './vendor-bills.service';

@Controller('api/accounting/vendor-bills')
export class VendorBillsController {
  constructor(private readonly service: VendorBillsService) {}

  @Post()
  create(@Body() data: CreateVendorBillDto, @Auth() user: User) {
    return this.service.create(data, user.id);
  }

  @Get()
  findAll(
    @Query('status', new ParseEnumPipe(SettlementStatus, { optional: true }))
    status?: SettlementStatus,
    @Query('supplierId', new ParseIntPipe({ optional: true }))
    supplierId?: number,
  ) {
    return this.service.findAll(status, supplierId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post(':id/post')
  post(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: PostVendorBillDto,
    @Auth() user: User,
  ) {
    return this.service.post(id, data, user.id);
  }
}
