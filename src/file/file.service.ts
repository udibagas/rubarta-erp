import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FileService {
  constructor(private prisma: PrismaService) {}

  getPathByName(fileName: string): Promise<{ filePath: string } | null> {
    return this.prisma.nkpAttachment.findFirst({
      where: {
        filePath: {
          endsWith: fileName,
        },
      },
      select: { filePath: true },
    });
  }
}
