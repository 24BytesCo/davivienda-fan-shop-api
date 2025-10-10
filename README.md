<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

## Davivienda Fan Shop API

API en NestJS para canje de productos por puntos o dinero.
- Autenticación JWT y semilla del primer usuario (opcional)
- Productos con imágenes (Firebase Storage, multipart/form-data)
- Carrito con validación de stock
- Órdenes: pago con puntos o dinero, confirmación y limpieza de carrito
- PostgreSQL + TypeORM
- Swagger disponible en `/api`

---

### Requisitos
- Docker y Docker Compose (recomendado)
- Alternativa local: Node.js >= 18 y Yarn/NPM

### Inicio rápido (Docker)
1) Clonar y entrar al proyecto
```
git clone https://github.com/24BytesCo/davivienda-fan-shop-api.git
cd davivienda-fan-shop-api
```

2) Variables de entorno
- Copia `.env.template` a `.env` y ajusta valores.
- `ENV=development` activa `synchronize` en TypeORM (solo desarrollo). Usa `production` en despliegue.

3) Firebase (obligatorio para subir imágenes)
- Descarga una clave de cuenta de servicio (JSON) de tu proyecto Firebase.
- Guárdala como `firebase-credentials.json` en la raíz del proyecto.
- En Docker, se monta dentro del contenedor en `/app/dist/firebase-credentials.json` (la ruta que el código compilado espera).

4) Levantar todo (API + DB)
```
docker compose up -d
```
- API: `http://localhost:3000/api` (si `3000` está ocupado, define `API_PORT=3001` en tu `.env`).
- Swagger: `http://localhost:3000/api`

### Usar la imagen publicada (sin compilar)
Repositorio: `24bytes/davivienda-fan-shop-api:1.0.1` (o `latest`)

Compose mínimo para consumidores (crear `docker-compose.yaml`):
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

### Arquitectura y módulos
- `AuthModule`: registro/login, emisión de JWT y seeder inicial (ADMIN) si no hay usuarios.
- `ProductosModule`: CRUD con imágenes (Firebase).
- `FilesModule`: subida/borrado de archivos.
- `CarritoModule`: gestión del carrito por usuario.
- `OrdenesModule`: checkout, confirmación de pago y consulta de órdenes.
- `ConfiguracionModule`: tasa COP por punto.
- `PuntosModule`: saldo, movimientos y ajustes de puntos.
- `CommonModule`: interceptor de respuesta estándar y filtro global de excepciones.

---

### Estándar de respuesta y errores
- Respuesta estándar:
```
{
  "statusCode": number,
  "ok": boolean,
  "message": string,
  "data": any | null
}
```
- Errores de negocio incluyen `code` y `detalle` cuando aplica.
  - `STOCK_INSUFICIENTE`, `SALDO_INSUFICIENTE`, `CANTIDAD_INVALIDA`.

---

### Autenticación (Auth) — `/api/auth`
- Registrar usuario: `POST /auth/register`
- Login: `POST /auth/login` → `{ user, token }`
- Listar usuarios activos (solo admin): `GET /auth/users` (Bearer)

---

### Productos — `/api/productos`
- Crear (admin): `POST /productos` (multipart/form-data, campo `images`)
- Listar: `GET /productos`
- Buscar por término (id/slug/título): `GET /productos/:termino`
- Obtener con eliminados (admin): `GET /productos/deleted/:id`
- Actualizar (admin): `PATCH /productos/:id` (multipart)
- Borrado lógico (admin): `DELETE /productos/:id`
- Campo `sizes` acepta arreglo real, JSON string o CSV (`"M,L"`).

---

### Archivos (Firebase Storage) — `/api/files`
- Subir múltiples (admin): `POST /files/upload` (multipart, campo `files`)
- Borrar en lote (admin): `DELETE /files/delete-batch` body `{ urls: string[] }`

---

### Carrito — `/api/carrito` (Bearer propio o admin)
- Obtener carrito: `GET /carrito/:userId`
- Agregar ítem: `POST /carrito/items` body `{ userId, productoId, cantidad }`
- Actualizar cantidad: `PATCH /carrito/items` body `{ userId, productoId, cantidad }`
- Eliminar ítem: `DELETE /carrito/items/:userId/:productoId`
- Limpiar: `DELETE /carrito/:userId`

---

### Puntos — `/api/puntos`
- Saldo (propio o admin): `GET /puntos/:userId`
- Movimientos (propio o admin): `GET /puntos/:userId/movimientos`
- Acreditar (admin): `POST /puntos/:userId/credit` body `{ cantidad, concepto?, ordenId? }`
- Debitar (admin): `POST /puntos/:userId/debit` body `{ cantidad, concepto?, ordenId? }`

---

### Órdenes — `/api/ordenes`
- Checkout (propio o admin): `POST /ordenes/checkout/:userId` body `{ modoPago: "PUNTOS" | "DINERO" }`
  - PUNTOS: orden `PAGADA`, descuenta saldo y stock, limpia carrito.
  - DINERO: orden `PENDIENTE`, calcula `totalCop`.
- Confirmar pago (admin): `POST /ordenes/:id/confirmar-pago` → descuenta stock y marca `PAGADA`.
- Mis órdenes (Bearer): `GET /ordenes/mis-ordenes`
- Órdenes por usuario (propio o admin): `GET /ordenes/usuario/:userId`

---

### Variables de entorno
- DB: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- App: `ENV`, `API_PORT`
- JWT: `JWT_SECRET`, `JWT_EXPIRES_IN`
- Firebase: `FIREBASE_STORAGE_BUCKET`
- Semilla inicial: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_FULLNAME`, `ADMIN_ROLE`

---

### Solución de problemas
- Postgres: "Database is uninitialized and superuser password is not specified"
  - Completa `DB_USER`, `DB_PASSWORD`, `DB_NAME` en `.env` y reinicia. Si ya se creó `./postgres` sin password, bórrala y levanta de nuevo.
- Puerto 3000 ocupado
  - Cambia `API_PORT` en `.env` (ej. `API_PORT=3001`) y `docker compose up -d`.
- Firebase credenciales
  - Asegura `firebase-credentials.json` en la raíz y que el compose lo monte en `/app/dist/firebase-credentials.json`.

---

### Comandos útiles
- Desarrollo: `yarn start:dev`
- Producción: `yarn build && yarn start:prod`
- Lint: `yarn lint`
- Test: `yarn test`

---

### Codificación y fin de línea
Este repositorio está configurado para UTF-8 y LF.
- `.editorconfig` y `.gitattributes` ya incluidos.
- Si ves caracteres extraños en Windows, configura tu editor a UTF-8 y, en PowerShell, usa `chcp 65001` antes de editar.

