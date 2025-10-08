/**
 * Pruebas end-to-end (E2E) mínimas de la aplicación.
 *
 * Objetivo:
 * - Verificar que la app inicializa y responde en la ruta raíz `/`.
 *
 * Notas:
 * - Utiliza `supertest` contra el servidor HTTP obtenido del `INestApplication`.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

/**
 * Suite E2E que valida la respuesta de la ruta raíz.
 */
describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  /**
   * Debe responder 200 y un cuerpo con "Hello World!" en la ruta raíz.
   */
  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});

