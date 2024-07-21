import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter
  extends BaseExceptionFilter
  implements ExceptionFilter
{
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const message = exception.message.replace(/\n/g, '');

    switch (exception.code) {
      case 'P2000': {
        const statusCode = HttpStatus.BAD_REQUEST;
        response.status(statusCode).json({ statusCode, message });
        break;
      }

      case 'P2002': {
        const statusCode = HttpStatus.BAD_REQUEST;
        const property = exception.meta.target[0];
        const error = `${property} has been taken`;
        response.status(statusCode).json({
          statusCode,
          message: 'Bad Request',
          errors: [{ property, error }],
        });
        break;
      }

      case 'P2025': {
        const statusCode = HttpStatus.NOT_FOUND;
        response
          .status(statusCode)
          .json({ statusCode, message: exception.meta?.cause || message });
        break;
      }

      default:
        super.catch(exception, host);
        break;
    }
  }
}
