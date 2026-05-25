# SSBW

Backend en Express (arquitectura MVC) con PostgreSQL + Prisma, scraping con Playwright y frontend integrado.

En produccion, la raiz sirve la portada de Astro y desde ella se enlaza a la app React de `web/` y a las paginas legacy de `public/`. En desarrollo local, si no existe build de Astro, se mantiene el fallback de `public/`.

## Puesta en marcha tras clonar el repo

### 1. Requisitos previos

- Node.js 20 o superior
- npm (incluido con Node)
- Docker Desktop (o Docker Engine + Docker Compose)

Comprueba versiones:

```bash
node -v
npm -v
docker -v
docker compose version
```

### 2. Clonar el repositorio

```bash
git clone <URL_DEL_REPO>
cd SSBW
```

### 3. Instalar dependencias del proyecto

```bash
npm install
```

### 4. Crear archivo `.env`

Este proyecto necesita al menos `DATABASE_URL` y `JWT_SECRET`.

Crea un archivo `.env` en la raíz con este contenido:

```env
PORT=3000
DATABASE_URL="postgresql://ssbw:ssbw@localhost:5433/ssbw?schema=public"
JWT_SECRET="cambia_este_secreto_en_produccion"
SCRAPE_MAX_PAGES=4
SCRAPE_HEADLESS=true
```

### 5. Levantar PostgreSQL con Docker

```bash
docker compose up -d postgres
```

El contenedor expone PostgreSQL en `localhost:5433` para evitar conflicto con instalaciones locales en `5432`.

### 6. Crear/actualizar tablas con Prisma

```bash
npm run db:push
```

### 7. Arrancar la aplicación

```bash
npm run dev
```

Aplicación disponible en:

- `http://localhost:3000` (frontend)
- `http://localhost:3000/health` (healthcheck)

## Servidor vite

Ubicado en la carpeta web.

```bash
cd web
npm run dev
```

Aplicación disponible en:

- `http://localhost:5173` (frontend)
  
## Usuario administrador por defecto

Al iniciar, si no existe, se crea automáticamente:

- Email: `DEFAULT_ADMIN_EMAIL` (por defecto `admin@ssbw.local`)
- Password: `DEFAULT_ADMIN_PASSWORD` (por defecto `Admin123!`)

En producción, **cambia siempre** `DEFAULT_ADMIN_PASSWORD` y `JWT_SECRET` mediante variables de entorno.

## Despliegue en DigitalOcean (App Platform)

El proyecto es viable para subir a DigitalOcean. Incluye backend Express, Prisma (PostgreSQL), una portada Astro en la raiz y la app React servida por el propio backend.

### 1. Crear base de datos administrada

- Crea un clúster de **Managed PostgreSQL** en DigitalOcean.
- Obtén la cadena de conexión y úsala en `DATABASE_URL` con SSL, por ejemplo:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:25060/ssbw?sslmode=require&schema=public"
```

### 2. Configurar app como servicio web desde Dockerfile

- En App Platform, elige el repositorio y selecciona despliegue por `Dockerfile`.
- El contenedor expone `PORT=3000`.
- En "Run Command" usa: `npm run start:cloud`.
- Define variables de entorno mínimas:
  - `NODE_ENV=production`
  - `PORT=3000`
  - `DATABASE_URL=...`
  - `JWT_SECRET=...`
  - `DEFAULT_ADMIN_EMAIL=...`
  - `DEFAULT_ADMIN_PASSWORD=...`
  - `CORS_ORIGINS=https://TU-DOMINIO` (si frontend y API van en dominios distintos)

### 3. Inicializar esquema Prisma en producción

Tras el primer deploy, ejecuta una vez:

```bash
npx prisma db push
```

Si usas `npm run start:cloud`, este paso se ejecuta automaticamente en cada arranque.

### 4. Verificación rápida post-deploy

- `GET /health` debe responder `{ "ok": true, ... }`.
- Abre `/` para comprobar la portada Astro.
- Desde la portada, verifica el enlace a `/react/` y el acceso a `/auth.html` y `/admin.html`.
- Comprueba login y acceso a `GET /api/auth/me`.
- Ejecuta un scraping corto (`maxPages=1`) para validar Playwright en runtime.

## Limitaciones actuales para cloud

- El carrito ya persiste en PostgreSQL (tabla `CartItem`) y no se pierde al reiniciar la app.
- Si en el futuro quieres sesiones revocables compartidas entre replicas, puedes complementar con Redis para invalidacion centralizada de tokens.

## Scripts útiles

- `npm run dev`: arranca en modo desarrollo con nodemon
- `npm run start`: arranca en modo normal
- `npm run start:cloud`: ejecuta `db:push` y luego arranca servidor (util en App Platform)
- `npm run db:push`: sincroniza esquema Prisma con la base de datos
- `npm run prisma:studio`: abre Prisma Studio
- `npm run scrape`: ejecuta scraping y genera `data/kiwoko-products.json`

## Backend para app Android (movil real)

Este backend ya es compatible con Android usando token Bearer.

### URL base recomendada

- Produccion (movil real): `https://TU-APP.ondigitalocean.app`
- Desarrollo con emulador Android: `http://10.0.2.2:3000`
- Desarrollo con movil fisico en la misma red: `http://IP_LOCAL_PC:3000`

### Headers y auth

- En Android usa `Authorization: Bearer <token>` para rutas protegidas.
- No dependas de cookies para la app movil.

### Campos y tipos utiles para Android

- IDs (`user.id`, `product.id`) son enteros: en Kotlin, mejor `Long`.
- `GET /api/products` devuelve objeto paginado (`total`, `take`, `skip`, `items`), no lista plana.

### Recomendaciones para movil

- Usa siempre HTTPS en produccion.
- Si pruebas por HTTP en local con movil fisico, habilita cleartext solo para debug en Android.

## Endpoints principales

- `GET /health`
- `GET /api/products` (filtros: `search`, `take`, `skip`, `sortBy`, `sortDir`)
  - Alias de paginacion compatibles con la tarea: `desde`, `hasta`
  - `sortBy` permitidos: `id`, `title`, `price`, `source`, `scrapedAt`, `createdAt`, `updatedAt`
  - `sortDir`: `asc`/`desc` (tambien acepta `ascendente`/`descendente`)
- `GET /api/products/:id`
- `POST /api/products/scrape/kiwoko`
- `GET /api/products/scrape/kiwoko`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/cart` (carrito del usuario autenticado)
- `POST /api/cart` (anadir producto al carrito)
- `DELETE /api/cart/:productId` (quitar una unidad)
- `DELETE /api/cart` (vaciar carrito)

## Pruebas API con REST Client

Se incluye el archivo `test-api.http` en la raiz para ejecutar pruebas desde la extension REST Client de VS Code.

## Guia Android + Prompt de auditoria

Para revisar coherencia entre este backend y tu app Android, usa `README_ANDROID_PROMPT.md`.

## Flujo rápido con Makefile (opcional)

Si usas `make`, puedes ejecutar:

```bash
make install
make db-up
make db-push
make dev
```

## Solución de problemas rápida

- Si falla la conexión a BD, revisa que `docker compose ps` muestre `ssbw-postgres` en estado `running`.
- Si `db:push` falla, verifica `DATABASE_URL` en `.env`.
- Si Playwright da problemas en primer uso, vuelve a ejecutar `npm install` para asegurar binarios.

## Estructura del proyecto

- `src/routes`: definición de endpoints
- `src/controllers`: manejo HTTP
- `src/services`: lógica de negocio
- `src/repositories`: acceso a datos con Prisma
- `src/scraper`: scraping de productos

## Nota legal

Respeta siempre términos de uso y `robots.txt` de la web objetivo al ejecutar scraping.
