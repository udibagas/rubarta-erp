import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { FilePolicy } from './file.policy';

@Module({
  controllers: [FileController],
  providers: [FileService, FilePolicy]
})
export class FileModule {}
