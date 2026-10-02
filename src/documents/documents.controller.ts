import { Controller, Get, Query } from '@nestjs/common';
import { DocumentsService } from './documents.service';

@Controller('api/documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get('search')
  search(@Query('keyword') keyword: string) {
    return this.documentsService.search(keyword);
  }
}
