import {
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'node:fs/promises';

@Controller('api/file')
export class FileController {
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const { originalname: fileName, size: fileSize, mimetype: fileType } = file;

    const [day, month, year] = new Date()
      .toLocaleString('id-ID', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
      .split('/');

    const timestamp = Date.now();
    const path = [year, month, day].join('/');
    await fs.mkdir(`./uploads/${path}`, { recursive: true });
    const filePath = `./uploads/${path}/${timestamp}-${fileName}`;
    await fs.writeFile(filePath, file.buffer);
    return { fileName, filePath, fileSize, fileType };
  }

  @Delete()
  async removeFile(@Query('path') path: string) {
    await fs.unlink(path);
    return { message: 'File has beed deleted' };
  }

  @Get()
  async getBase64StringByPath(@Query('path') path: string) {
    const buffer = await fs.readFile(path);
    return buffer.toString('base64');
  }
}
