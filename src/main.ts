import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      enableDebugMessages: true,
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: true,
      validationError: {
        target: false,
        value: false,
      },
      exceptionFactory: (errors) => {
        const error = {};

        errors.forEach((e) => {
          error[e.property] = Object.values(e.constraints)[0];
        });

        throw new BadRequestException({
          statusCode: 400,
          message: 'Bad Request',
          error: error,
        });
      },
    }),
  );
  await app.listen(3000);
}
bootstrap();
