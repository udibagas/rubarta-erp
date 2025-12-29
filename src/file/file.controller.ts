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
import { FileService } from './file.service';

@Controller('api/file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

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
          new MaxFileSizeValidator({ maxSize: 10000000 }),
          // new FileTypeValidator({ fileType: 'image/jpeg' }),
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

  @Post('move-file')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.diskStorage({
        async destination(req, file, callback) {
          const attachment = await this.fileService.getPathByName(
            file.originalname,
          );

          if (!attachment) {
            return callback(new Error('File not found in database'), null);
          }

          const path = attachment.filePath.split('/').slice(0, -1).join('/');
          await fs.mkdir(`./${path}`, { recursive: true });
          callback(null, `./${path}`);
        },
        filename(req, file, callback) {
          callback(null, file.originalname);
        },
      }),
    }),
  )
  async moveFile() {
    return { message: 'Test endpoint works' };
  }
}
