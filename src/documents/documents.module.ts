import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentsPolicy } from './documents.policy';

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentsPolicy]
})
export class DocumentsModule {}
