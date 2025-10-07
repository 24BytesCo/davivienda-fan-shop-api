import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { TransformResponseInterceptor } from './common/interceptors/transform-response/transform-response.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions/all-exceptions.filter';

async function main() {
  const app = await NestFactory.create(AppModule);

  // Establecer prefijo global para las rutas
  app.setGlobalPrefix('api');

  //usar validaciones globales
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

   // Aplicando el interceptor de respuesta estándar para todas las respuestas
  app.useGlobalInterceptors(new TransformResponseInterceptor());

  //Aplicando el filtro de excepciones global
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(process.env.PORT ?? 3000);
}
main();
