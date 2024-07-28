import {
  Controller,
  Post,
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

    const path = [year, month, day].join('/');
    await fs.mkdir(`./uploads/${path}`, { recursive: true });
    const filePath = `./uploads/${path}/${fileName}`;
    await fs.writeFile(filePath, file.buffer);
    return { fileName, filePath, fileSize, fileType };
  }
}
