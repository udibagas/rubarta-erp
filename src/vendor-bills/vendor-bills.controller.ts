import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Post,
  Query,
  SerializeOptions,
} from '@nestjs/common';
import { Auth } from '../auth/auth.decorator';
import { SettlementStatus, User } from '../prisma/client/client';
import { CreateVendorBillDto, PostVendorBillDto } from './vendor-bills.dto';
import { VendorBillsService } from './vendor-bills.service';
import { VendorBill } from './vendor-bill.entity';

@Controller('api/accounting/vendor-bills')
export class VendorBillsController {
  constructor(private readonly service: VendorBillsService) {}

  @Post()
  @SerializeOptions({ type: VendorBill })
  create(@Body() data: CreateVendorBillDto, @Auth() user: User) {
    return this.service.create(data, user.id);
  }

  @Get()
  @SerializeOptions({ type: VendorBill })
  findAll(
    @Query('status', new ParseEnumPipe(SettlementStatus, { optional: true }))
    status?: SettlementStatus,
    @Query('supplierId', new ParseIntPipe({ optional: true }))
    supplierId?: number,
  ) {
    return this.service.findAll(status, supplierId);
  }

  @Get(':id')
  @SerializeOptions({ type: VendorBill })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post(':id/post')
  @SerializeOptions({ type: VendorBill })
  post(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: PostVendorBillDto,
    @Auth() user: User,
  ) {
    return this.service.post(id, data, user.id);
  }
}
