import {
  Controller,
  Delete,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import * as fs from 'node:fs/promises';
import { FileDto } from './fle.dto';

@Controller('api/file')
export class FileController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.diskStorage({
        async destination(req, file, callback) {
          const [day, month, year] = new Date()
            .toLocaleString('id-ID', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            })
            .split('/');

          const path = './uploads/' + [year, month, day].join('/');
          await fs.mkdir(path, { recursive: true });
          callback(null, path);
        },
        filename(req, file, callback) {
          callback(null, `${Date.now()}-${file.originalname}`);
        },
      }),
    }),
  )
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 2000000 }),
          new FileTypeValidator({ fileType: 'image|pdf' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<FileDto> {
    const {
      originalname: fileName,
      size: fileSize,
      mimetype: fileType,
      path: filePath,
    } = file;
    return { fileName, fileSize, fileType, filePath };
  }

  @Delete()
  async removeFile(@Query('path') path: string) {
    await fs.unlink(path);
    return { message: 'File has beed deleted' };
  }
}
