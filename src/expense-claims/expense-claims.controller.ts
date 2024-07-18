import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ExpenseClaimsService } from './expense-claims.service';
import { ExpenseClaimDto } from './dto/expense-claim.dto';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Expense Claims')
@ApiBearerAuth()
@Controller('api/expense-claims')
export class ExpenseClaimsController {
  constructor(private readonly expenseClaimsService: ExpenseClaimsService) {}

  @Post()
  @ApiOperation({ summary: 'Create new expense claim' })
  create(@Body() expenseClaimDto: ExpenseClaimDto) {
    return this.expenseClaimsService.create(expenseClaimDto);
  }

  @Get()
  @ApiOperation({ summary: 'Gel all expense claims' })
  findAll() {
    return this.expenseClaimsService.findAll({});
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single expense claim by id' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.expenseClaimsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update expense claim by id' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() expenseClaimDto: ExpenseClaimDto,
  ) {
    return this.expenseClaimsService.update(id, expenseClaimDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete expense claim by id' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.expenseClaimsService.remove(id);
  }

  @Delete(':id/:itemId')
  @ApiOperation({ summary: 'Remove expense claim by id' })
  @ApiParam({
    name: 'id',
    description: 'Expense Claim ID',
    example: 1,
  })
  @ApiParam({
    name: 'itemId',
    description: 'Expense Claim Item ID',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Deleted item',
  })
  removeItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return this.expenseClaimsService.removeItem(id, itemId);
  }

  @Post('approve/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve expense claim by id' })
  approve() {
    // TODO
  }

  @Post('reject/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject expense claim by id' })
  reject() {
    // todo
  }
}
