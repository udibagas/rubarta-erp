import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  ParseEnumPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { InteractionsService } from './interactions.service';
import {
  CreateInteractionDto,
  UpdateInteractionDto,
} from './dto/interaction.dto';
import { InteractionType } from '../prisma/client/client';

@ApiTags('Interactions')
@ApiBearerAuth()
@Controller('api/interactions')
export class InteractionsController {
  constructor(private readonly interactionsService: InteractionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create new interaction' })
  @ApiCreatedResponse({ description: 'Interaction created' })
  create(@Body() createInteractionDto: CreateInteractionDto) {
    return this.interactionsService.create(createInteractionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all interactions' })
  @ApiOkResponse({ description: 'List of interactions' })
  findAll(
    @Query('keyword') keyword?: string,
    @Query('customerId', new ParseIntPipe({ optional: true }))
    customerId?: number,
    @Query('userId', new ParseIntPipe({ optional: true })) userId?: number,
    @Query('leadId', new ParseIntPipe({ optional: true })) leadId?: number,
    @Query('opportunityId', new ParseIntPipe({ optional: true }))
    opportunityId?: number,
    @Query('contactId', new ParseIntPipe({ optional: true }))
    contactId?: number,
    @Query('type', new ParseEnumPipe(InteractionType, { optional: true }))
    type?: InteractionType,
    @Query('isPaginated') isPaginated?: boolean,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.interactionsService.findAll({
      keyword,
      customerId,
      userId,
      leadId,
      opportunityId,
      contactId,
      type,
      isPaginated: isPaginated === true,
      page,
      limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get interaction by ID' })
  @ApiOkResponse({ description: 'Interaction details' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.interactionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update interaction' })
  @ApiOkResponse({ description: 'Interaction updated' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInteractionDto: UpdateInteractionDto,
  ) {
    return this.interactionsService.update(id, updateInteractionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete interaction (soft delete)' })
  @ApiOkResponse({ description: 'Interaction deleted' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.interactionsService.remove(id);
  }
}
