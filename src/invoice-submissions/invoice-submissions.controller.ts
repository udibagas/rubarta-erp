import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  SerializeOptions,
} from '@nestjs/common';
import { Auth } from '../auth/auth.decorator';
import { User } from '../prisma/client/client';
import {
  CreateInvoiceSubmissionDto,
  QueryInvoiceSubmissionsDto,
  UpdateInvoiceSubmissionDto,
  UpdateInvoiceSubmissionStatusDto,
} from './invoice-submissions.dto';
import { InvoiceSubmission } from './invoice-submission.entity';
import { InvoiceSubmissionsService } from './invoice-submissions.service';

@Controller('api/invoice-submissions')
export class InvoiceSubmissionsController {
  constructor(
    private readonly invoiceSubmissionsService: InvoiceSubmissionsService,
  ) {}

  @Post()
  @SerializeOptions({ type: InvoiceSubmission })
  create(@Body() data: CreateInvoiceSubmissionDto, @Auth() user: User) {
    return this.invoiceSubmissionsService.create(data, user);
  }

  @Get()
  @SerializeOptions({ type: InvoiceSubmission })
  findAll(@Query() query: QueryInvoiceSubmissionsDto, @Auth() user: User) {
    return this.invoiceSubmissionsService.findAll(query, user);
  }

  @Get(':id')
  @SerializeOptions({ type: InvoiceSubmission })
  findOne(@Param('id', ParseIntPipe) id: number, @Auth() user: User) {
    return this.invoiceSubmissionsService.findOne(id, user);
  }

  @Patch(':id/status')
  @SerializeOptions({ type: InvoiceSubmission })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateInvoiceSubmissionStatusDto,
    @Auth() user: User,
  ) {
    return this.invoiceSubmissionsService.updateStatus(id, data, user);
  }

  @Patch(':id')
  @SerializeOptions({ type: InvoiceSubmission })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateInvoiceSubmissionDto,
    @Auth() user: User,
  ) {
    return this.invoiceSubmissionsService.update(id, data, user);
  }

  @Delete(':id')
  @SerializeOptions({ type: InvoiceSubmission })
  remove(@Param('id', ParseIntPipe) id: number, @Auth() user: User) {
    return this.invoiceSubmissionsService.remove(id, user);
  }
}
