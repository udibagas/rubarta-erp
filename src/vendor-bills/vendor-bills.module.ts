import { Module } from '@nestjs/common';
import { AccountingPostingModule } from '../accounting-posting/accounting-posting.module';
import { VendorBillsController } from './vendor-bills.controller';
import { VendorBillsService } from './vendor-bills.service';

@Module({
  imports: [AccountingPostingModule],
  controllers: [VendorBillsController],
  providers: [VendorBillsService],
})
export class VendorBillsModule {}
