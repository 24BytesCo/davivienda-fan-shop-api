<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest



## Davivienda Fan Shop API

Backend en NestJS para gestión de productos con carga de imágenes en Firebase Storage y autenticación basada en JWT. Las respuestas siguen un formato estándar y los errores se manejan con un filtro global.

---

### Requisitos
- Node.js >= 18 (recomendado) / probado con 22
- Yarn o npm
- Docker (para base de datos con `docker-compose`)

### Configuración rápida
1) Clonar y entrar al proyecto
```
git clone https://github.com/24BytesCo/davivienda-fan-shop-api.git
cd davivienda-fan-shop-api
```

2) Instalar dependencias
```
yarn install
```

3) Variables de entorno
- Copiar `.env.template` a `.env` y completar valores.
- Variables principales:
  - Base de datos: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
  - Entorno: `ENV=development | production`
  - JWT: `JWT_SECRET`, `JWT_EXPIRES_IN`
  - Firebase: `FIREBASE_STORAGE_BUCKET`
  - Usuario inicial opcional al arranque (solo si no existen usuarios):
    - `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_FULLNAME`, `ADMIN_ROLE` (o `ADMIN_ROLES`)

4) Credenciales de Firebase
- Copiar `firebase-credentials.template.json` a `firebase-credentials.json` y completar con la cuenta de servicio.

5) Base de datos (PostgreSQL con Docker)
```
docker-compose up -d
```

6) Ejecutar en desarrollo
```
yarn start:dev
```

La app expone rutas con prefijo global `api` (por ejemplo: `/api/auth/login`).

---

### Arquitectura y módulos
- `AuthModule`
  - Registro y login de usuarios via JWT.
  - Seeder de primer usuario al arranque si no hay registros (lee variables `ADMIN_*`).
- `ProductosModule`
  - CRUD de productos con soporte de imágenes.
- `FilesModule`
  - Upload y borrado de archivos en Firebase Storage.
- `CommonModule`
  - Interceptor de respuesta estándar y filtro global de excepciones.

Prefijo global de rutas: definido en `main.ts` como `api`.

---

### Estándar de respuesta y manejo de errores
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

---

### Autenticación (Auth)
Rutas bajo `/api/auth`.

- Registro (público)
  - `POST /api/auth/register`
  - Body mínimo:
    ```json
    {
      "email": "usuario@example.com",
      "password": "GatoVerde#2025",
      "fullName": "Nombre Apellido"
    }
    ```
  - Política de contraseña: mínimo 12 caracteres, mayúscula, minúscula, dígito, carácter especial y sin espacios.
  - Asignación de rol: si no hay creador autenticado, se asigna rol `usuario`.
  - Nota: opcionalmente acepta `role` y `creatorRole` (interno). Reglas:
    - Sin `creatorRole` → siempre `usuario`.
    - `creatorRole=administrador` → puede crear `administrador` | `editor` | `usuario`.
    - `creatorRole=editor` → solo puede crear `usuario`.

- Login
  - `POST /api/auth/login`
  - Body:
    ```json
    {
      "email": "usuario@example.com",
      "password": "GatoVerde#2025"
    }
    ```
  - Respuesta: `{ user: { ...sin password }, token: "<jwt>" }` envuelta por el interceptor estándar.

- JWT
  - Configurado con `JWT_SECRET` y `JWT_EXPIRES_IN` (por `.env`).

- Usuario inicial al arranque (semilla)
  - Se ejecuta una única vez si la tabla `users` está vacía.
  - Variables requeridas: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_FULLNAME`.
  - Rol opcional por `ADMIN_ROLE` (o `ADMIN_ROLES`): `administrador` | `editor` | `usuario` (por defecto `administrador`).

---

### Productos
Rutas bajo `/api/productos`.

- Crear producto con imágenes
  - `POST /api/productos`
  - `multipart/form-data` con campo `images` (múltiples archivos) y campos del DTO de producto.
  - Sube imágenes a Firebase Storage y guarda URLs.

- Listar productos
  - `GET /api/productos`

- Buscar por término (ID/slug/título)
  - `GET /api/productos/:termino`

- Obtener por ID incluyendo eliminados lógicos
  - `GET /api/productos/deleted/:id`

- Actualizar
  - `PATCH /api/productos/:id`

- Borrado lógico
  - `DELETE /api/productos/:id`

Notas:
- El propietario (`owner`) del producto es opcional actualmente (se permite nulo) para compatibilidad con datos existentes.

---

### Archivos (Firebase Storage)
Rutas bajo `/api/files`.

- Subir múltiples
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
- `firebase-credentials.json` válido (cuenta de servicio) en la raíz del proyecto.

---

### Variables de entorno
Relevantes para la app:
- Base de datos: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- Entorno: `ENV`
- JWT: `JWT_SECRET`, `JWT_EXPIRES_IN`
- Firebase: `FIREBASE_STORAGE_BUCKET`
- Semilla de usuario: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_FULLNAME`, `ADMIN_ROLE`/`ADMIN_ROLES`

Ejecuta `docker-compose up -d` para levantar PostgreSQL con los valores de `.env`.

---

### Comandos útiles
- Desarrollo: `yarn start:dev`
- Producción (build + run): `yarn build && yarn start:prod`
- Lint: `yarn lint`
- Test: `yarn test`

---

### Notas
- Todas las rutas van bajo `/api` por el prefijo global en `main.ts`.
- Las respuestas usan un formato estándar y los errores se normalizan vía el filtro global.
- Para producción: deshabilitar `synchronize` y usar migraciones.
