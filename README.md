<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest



## Davivienda Fan Shop API

API de comercio en NestJS para canje de productos por puntos o dinero, con:
- AutenticaciÃ³n JWT y semilla de primer usuario opcional
- Productos con imÃ¡genes en Firebase Storage (multipart/form-data)
- Carrito con validaciones de stock
- Ã“rdenes con checkout por puntos o por dinero
- PostgreSQL + TypeORM
- Swagger disponible bajo `/api`

---

### Requisitos
- Docker y Docker Compose (recomendado)
- Alternativa local: Node.js >= 18 y Yarn/NPM

### Inicio rÃ¡pido (Docker)
1) Clonar y entrar al proyecto
```
git clone https://github.com/24BytesCo/davivienda-fan-shop-api.git
cd davivienda-fan-shop-api
```

2) Variables de entorno
- Copia `.env.template` a `.env` y ajusta valores.
- `ENV=development` activa `synchronize` en TypeORM. Usa `production` en despliegue.

3) Firebase (obligatorio para subir imÃ¡genes)
- Descarga una clave de cuenta de servicio (JSON) de tu proyecto Firebase.
- Guarda el archivo como `firebase-credentials.json` en la raÃ­z del proyecto.
- En Docker, el archivo se monta dentro del contenedor donde el cÃ³digo compilado lo espera (`/app/dist/firebase-credentials.json`).

4) Levantar todo (API + DB)
```
docker compose up -d
```
- La API queda disponible en `http://localhost:3000/api` (si `3000` estÃ¡ ocupado, define `API_PORT=3001` en tu `.env`).
- Swagger: `http://localhost:3000/api`

5) Logs y mantenimiento
```
docker compose logs -f api
docker compose restart api
docker compose down           # apaga
docker compose down -v        # apaga y borra datos de DB
```

### Usar la imagen publicada (sin compilar)
Repositorio: `24bytes/davivienda-fan-shop-api:1.0.1` (o `latest`)

Compose mÃ­nimo para consumidores (crea un archivo `docker-compose.yaml` aparte):
```yaml
services:
  api:
    image: 24bytes/davivienda-fan-shop-api:1.0.1
    container_name: fan-shop-api
    restart: always
    ports:
      - "${API_PORT:-3000}:3000"
    environment:
      ENV: ${ENV}
      DB_HOST: db
      DB_PORT: 5432
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      DB_NAME: ${DB_NAME}
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN}
      FIREBASE_STORAGE_BUCKET: ${FIREBASE_STORAGE_BUCKET}
    volumes:
      - ./firebase-credentials.json:/app/dist/firebase-credentials.json:ro
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:14.3
    container_name: fan-shop-db
    restart: always
    ports:
      - "${DB_PORT_HOST:-5432}:5432"
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - ./postgres:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 5s
      timeout: 5s
      retries: 10
```

`.env` de ejemplo para consumidores:
```
ENV=production
API_PORT=3000
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=davivienda_fan_shop
JWT_SECRET=un_secreto_seguro
JWT_EXPIRES_IN=1d
FIREBASE_STORAGE_BUCKET=tu-bucket.appspot.com
```

---

### Arquitectura y mÃ³dulos
- `AuthModule`
  - Registro y login de usuarios via JWT.
  - Seeder de primer usuario al arranque si no hay registros (lee variables `ADMIN_*`).
- `ProductosModule`
  - CRUD de productos con soporte de imÃ¡genes.
- `FilesModule`
  - Upload y borrado de archivos en Firebase Storage.
- `CommonModule`
  - Interceptor de respuesta estÃ¡ndar y filtro global de excepciones.

Prefijo global de rutas: definido en `main.ts` como `api`.

---

### EstÃ¡ndar de respuesta y manejo de errores
- Interceptor global: transforma toda respuesta a:
```
{
  "statusCode": number,
  "ok": boolean,
  "message": string,
  "data": any | null
}
```
- Filtro global de excepciones:
  - Estructura similar con `ok=false` y `message` descriptivo.
  - Mapea errores de PostgreSQL comunes (p. ej., `23505` conflicto).

Notas de validaciÃ³n de stock y puntos:
- El carrito valida cantidades contra el stock actual al agregar/editar.
- En checkout con PUNTOS, se descuenta saldo y stock de forma atÃ³mica dentro de una transacciÃ³n; si algo falla no se crea la orden.
- En checkout con DINERO, la orden queda `PENDIENTE` y el stock se descuenta al confirmar pago (`confirmar-pago`).

---

### AutenticaciÃ³n (Auth)
Rutas bajo `/api/auth`.

- Registro (pÃºblico)
  - `POST /api/auth/register`
  - Body mÃ­nimo:
    ```json
    {
      "email": "usuario@example.com",
      "password": "GatoVerde#2025",
      "fullName": "Nombre Apellido"
    }
    ```
  - PolÃ­tica de contraseÃ±a: mÃ­nimo 12 caracteres, mayÃºscula, minÃºscula, dÃ­gito, carÃ¡cter especial y sin espacios.
  - AsignaciÃ³n de rol: si no hay creador autenticado, se asigna rol `usuario`.
  - Nota: opcionalmente acepta `role` y `creatorRole` (interno). Reglas:
    - Sin `creatorRole` â†’ siempre `usuario`.
    - `creatorRole=administrador` â†’ puede crear `administrador` | `editor` | `usuario`.
    - `creatorRole=editor` â†’ solo puede crear `usuario`.

- Login
  - `POST /api/auth/login`
  - Body:
    ```json
    {
      "email": "usuario@example.com",
      "password": "GatoVerde#2025"
    }
    ```
  - Respuesta: `{ user: { ...sin password }, token: "<jwt>" }` envuelta por el interceptor estÃ¡ndar.

- JWT
  - Configurado con `JWT_SECRET` y `JWT_EXPIRES_IN` (por `.env`).

- Usuario inicial al arranque (semilla)
  - Se ejecuta una Ãºnica vez si la tabla `users` estÃ¡ vacÃ­a.
  - Variables requeridas: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_FULLNAME`.
  - Rol opcional por `ADMIN_ROLE` (o `ADMIN_ROLES`): `administrador` | `editor` | `usuario` (por defecto `administrador`).

---

### Productos
Rutas bajo `/api/productos`.

- Crear producto con imÃ¡genes
  - `POST /api/productos`
  - `multipart/form-data` con campo `images` (mÃºltiples archivos) y campos del DTO de producto.
  - Sube imÃ¡genes a Firebase Storage y guarda URLs.
  - Campo `sizes` acepta arreglo real (`["M","L"]`), JSON como string (`"[\"M\",\"L\"]"`) o cadena separada por comas (`"M,L"`).

- Listar productos
  - `GET /api/productos`

- Buscar por tÃ©rmino (ID/slug/tÃ­tulo)
  - `GET /api/productos/:termino`

- Obtener por ID incluyendo eliminados lÃ³gicos
  - `GET /api/productos/deleted/:id`

- Actualizar
  - `PATCH /api/productos/:id`
  - `multipart/form-data` con `images` para reemplazar imÃ¡genes. Si no se envÃ­an archivos, se conservan las existentes. TambiÃ©n puedes pasar `images` como arreglo de URLs en el body para reasignar.

- Borrado lÃ³gico
  - `DELETE /api/productos/:id`

Notas:
- El propietario (`owner`) del producto es opcional actualmente (se permite nulo) para compatibilidad con datos existentes.

---

### Archivos (Firebase Storage)
Rutas bajo `/api/files`.

- Subir mÃºltiples
  - `POST /api/files/upload`
  - `multipart/form-data` con campo `files`.

- Borrar en lote por URLs
  - `DELETE /api/files/delete-batch`
  - Body:
    ```json
    { "urls": ["https://storage.googleapis.com/BUCKET/archivo1.png"] }
    ```

Requisitos:
- `FIREBASE_STORAGE_BUCKET` en `.env`.
- `firebase-credentials.json` vÃ¡lido (cuenta de servicio) en la raÃ­z del proyecto.
- En Docker, monta ese archivo dentro del contenedor en `/app/dist/firebase-credentials.json`.

---

### Puntos
Rutas bajo `/api/puntos`.

- Consultar saldo
  - `GET /api/puntos/:userId`
  - Respuesta: `{ userId, saldo }`

- Listar movimientos (recientes primero)
  - `GET /api/puntos/:userId/movimientos?limit=&offset=`

- Acreditar puntos
  - `POST /api/puntos/:userId/credit`
  - Body: `{ cantidad: number (>0), concepto?: string, ordenId?: uuid }`

- Debitar puntos
  - `POST /api/puntos/:userId/debit`
  - Body: `{ cantidad: number (>0), concepto?: string, ordenId?: uuid }`

Validaciones y atomicidad:
- Crea el saldo si no existe y ajusta usando increment/decrement atómicos.
- Al debitar valida `saldo >= cantidad`; si no, 400 con `code: SALDO_INSUFICIENTE`.


---

### Variables de entorno
Relevantes para la app:
- Base de datos: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- Entorno: `ENV`
- Puerto de la API (host): `API_PORT` (solo para mapeo de puertos en Docker Compose)
- JWT: `JWT_SECRET`, `JWT_EXPIRES_IN`
- Firebase: `FIREBASE_STORAGE_BUCKET`
- Semilla de usuario: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_FULLNAME`, `ADMIN_ROLE`/`ADMIN_ROLES`

Ejecuta `docker-compose up -d` para levantar PostgreSQL con los valores de `.env`.

---

### Comandos Ãºtiles
- Desarrollo: `yarn start:dev`
- ProducciÃ³n (build + run): `yarn build && yarn start:prod`
- Lint: `yarn lint`
- Test: `yarn test`

---

### Notas
- Todas las rutas van bajo `/api` por el prefijo global en `main.ts`.
- Las respuestas usan un formato estÃ¡ndar y los errores se normalizan vÃ­a el filtro global.
- Para producciÃ³n: deshabilitar `synchronize` y usar migraciones.

---

### Pago y Ã³rdenes (resumen rÃ¡pido)
- Pagar con puntos (inmediato):
  - `POST /api/ordenes/checkout/:userId` con `{ "modoPago": "PUNTOS" }`
  - Crea orden `PAGADA`, descuenta puntos y stock y limpia el carrito.
- Pagar con dinero (dos pasos):
  - `POST /api/ordenes/checkout/:userId` con `{ "modoPago": "DINERO" }` â†’ crea orden `PENDIENTE` y calcula `totalCop`.
  - `POST /api/ordenes/:id/confirmar-pago` â†’ valida stock y marca `PAGADA` descontando stock y limpiando carrito.

- Mis órdenes (con token):
  - `GET /api/ordenes/mis-ordenes` con `Authorization: Bearer <token>`.
  - Usa el `sub` del JWT para devolver solo las órdenes del usuario autenticado.

Errores de negocio (códigos)
- `STOCK_INSUFICIENTE`: cuando el stock no alcanza (en carrito o checkout). Incluye `disponible` y `solicitado`.
- `CANTIDAD_INVALIDA`: cuando la cantidad enviada es <= 0.
- `SALDO_INSUFICIENTE`: al pagar con puntos sin saldo suficiente. Incluye `requerido`.

---

### Autorización y administración
- Autenticación JWT: `POST /api/auth/login` → usa “Authorize” en Swagger (Bearer).
- Listar usuarios activos (solo admin):
  - `GET /api/auth/users` con `Authorization: Bearer <token_admin>`.
  - Protegido por guard de rol administrador.

---

### Solución de problemas comunes
- Postgres: “Database is uninitialized and superuser password is not specified”
  - Asegura `DB_USER`, `DB_PASSWORD`, `DB_NAME` en `.env`.
  - Si se inicializó sin password, borra la carpeta `./postgres` y levanta de nuevo.
- Puerto 3000 ocupado
  - Cambia `API_PORT` en `.env` (ej. `API_PORT=3001`) y recrea.
- Firebase credenciales
  - Verifica que `firebase-credentials.json` exista en la raíz y que `FIREBASE_STORAGE_BUCKET` sea correcto.


