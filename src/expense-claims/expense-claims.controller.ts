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
  Query,
} from '@nestjs/common';
import { ExpenseClaimsService } from './expense-claims.service';
import { ExpenseClaimDto } from './expense-claim.dto';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Auth } from '../auth/auth.decorator';
import { User } from '@prisma/client';

@ApiTags('Expense Claims')
@ApiBearerAuth()
@Controller('api/expense-claims')
export class ExpenseClaimsController {
  constructor(private readonly expenseClaimsService: ExpenseClaimsService) {}

  @Post()
  @ApiOperation({ summary: 'Create new expense claim' })
  create(@Body() expenseClaimDto: ExpenseClaimDto, @Auth() user: User) {
    return this.expenseClaimsService.create({
      ...expenseClaimDto,
      userId: user.id,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Gel all expense claims' })
  findAll(
    @Query('page', ParseIntPipe) page: number,
    @Query('pageSize', ParseIntPipe) pageSize: number,
    @Query('keyword') keyword: string,
    @Query('companyId', ParseIntPipe) companyId: number,
  ) {
    return this.expenseClaimsService.findAll({
      page,
      pageSize,
      companyId,
      keyword,
    });
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
  @ApiOperation({ summary: 'Approve expense claim by id' })
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    description: 'Expense Claim ID',
    example: 1,
  })
  @ApiOperation({ summary: 'Approve expense claim by id' })
  approve(
    @Param('id', ParseIntPipe) id: number,
    @Auth() user: User,
    @Body('note') note?: string,
  ) {
    return this.expenseClaimsService.approve(id, user.id, note);
  }

  @Post('submit/:id')
  @ApiOperation({ summary: 'Submit data' })
  @HttpCode(HttpStatus.OK)
  submit(@Param('id', ParseIntPipe) id: number, @Auth() user: User) {
    return this.expenseClaimsService.submit(id, user.id);
  }
}
