import { HttpAdapterHost, NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  BadRequestException,
  ClassSerializerInterceptor,
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import helmet from 'helmet';
import { nestCsrf, CsrfFilter } from 'ncsrf';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationError } from 'class-validator';
import { PrismaClientExceptionFilter } from './prisma/prisma-client-exception.filter';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { createLogger } from './logging/logger.config';
import { DatabaseLogger } from './logging/database-logger';
import { PrismaService } from './prisma/prisma.service';
import { httpLogger } from './logging/http-logger.middleware';

const corsOrigins = process.env.CORS_ORIGINS?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean) ?? ['http://localhost:4000', 'https://erp.rubarta.co.id'];

const cspFrameAncestors = process.env.CSP_FRAME_ANCESTORS?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean) ?? [
  'http://localhost:4000',
  'https://erp.rubarta.co.id',
  'https://nkp.rubarta.co.id',
];

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
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    cors: {
      credentials: true,
      origin: corsOrigins,
    },
  });

  const logger = createLogger();
  app.useLogger(logger);
  if (logger instanceof DatabaseLogger) logger.attach(app.get(PrismaService));
  app.use(httpLogger);
  app.setBaseViewsDir(join(__dirname, '../..', 'views'));
  app.setViewEngine('ejs');

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
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          frameAncestors: ["'self'", ...cspFrameAncestors],
        },
      },
    }),
  );

  app.use(cookieParser());
  app.use(nestCsrf());
  app.useGlobalFilters(new CsrfFilter());
  app.useBodyParser('json', { limit: '10mb' });

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
  Logger.log(`Application listening on port 3000`, 'Bootstrap');
}
bootstrap().catch((error) => {
  Logger.fatal(
    error instanceof Error ? error.stack : String(error),
    'Bootstrap',
  );
  process.exit(1);
});
