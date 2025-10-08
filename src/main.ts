import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { TransformResponseInterceptor } from './common/interceptors/transform-response/transform-response.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions/all-exceptions.filter';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function main() {
  const app = await NestFactory.create(AppModule);

  // Establecer prefijo global para las rutas
  app.setGlobalPrefix('api');

  //usar validaciones globales
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger (OpenAPI)
  const openapiConfig = new DocumentBuilder()
    .setTitle('Davivienda Fan Shop API')
    .setDescription('API para gestión de productos, archivos y autenticación')
    .setVersion('1.0.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      in: 'header',
      name: 'Authorization',
      description: 'Token JWT con formato: Bearer <token>',
    })
    .build();
  const openapiDocument = SwaggerModule.createDocument(app, openapiConfig, {
    deepScanRoutes: true,
  });
  SwaggerModule.setup('api', app, openapiDocument, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  });

  // Aplicando el interceptor de respuesta estándar para todas las respuestas
  app.useGlobalInterceptors(new TransformResponseInterceptor());

  //Aplicando el filtro de excepciones global
  app.useGlobalFilters(new AllExceptionsFilter());

  //Configurar cors
  app.enableCors();

  // Fin configuración Swagger

  await app.listen(process.env.PORT ?? 3000);
}
main();
