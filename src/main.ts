import { HttpAdapterHost, NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  BadRequestException,
  ClassSerializerInterceptor,
  ValidationPipe,
} from '@nestjs/common';
import helmet from 'helmet';
import { nestCsrf, CsrfFilter } from 'ncsrf';
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationError } from 'class-validator';
import { PrismaClientExceptionFilter } from './prisma/prisma-client-exception.filter';

function parseValidationError(errors: ValidationError[]) {
  return errors.map((error) => {
    const e = { property: error.property, error: '', children: [] };

    if (error.constraints) {
      e.error = Object.values(error.constraints).join(', ');
    } else delete e.error;

    if (error.children && error.children.length > 0) {
      e.children = parseValidationError(error.children);
    } else delete e.children;

    return e;
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      credentials: true,
      origin: [
        'http://localhost:4000',
        'http://erp.rubarta.co.id',
        'http://nkp.rubarta.co.id',
        'https://erp.rubarta.co.id',
        'https://nkp.rubarta.co.id',
      ],
    },
  });

  const config = new DocumentBuilder()
    .setTitle('Rubarta ERP')
    .setDescription('Rubarta ERP Documentation')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Enter JWT',
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.use(
    helmet({
      crossOriginResourcePolicy: false, // biar bisa dapetin static content
    }),
  );
  app.use(cookieParser());
  app.use(nestCsrf());

  app.useGlobalFilters(new CsrfFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      enableDebugMessages: true,
      transform: true,
      whitelist: true,
      // forbidNonWhitelisted: true,
      stopAtFirstError: true,
      validationError: {
        target: false,
        value: false,
      },
      exceptionFactory: (errors) => {
        const error = parseValidationError(errors);
        throw new BadRequestException({
          statusCode: 400,
          message: 'Bad Request',
          errors: error,
        });
      },
    }),
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapter));

  await app.listen(3000);
}
bootstrap();
