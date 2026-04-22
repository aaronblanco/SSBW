# SSBW

Backend en Express (arquitectura MVC) con PostgreSQL + Prisma, scraping con Playwright y frontend estático servido desde `public/`.

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

## Usuario administrador por defecto

Al iniciar, si no existe, se crea automáticamente:

- Email: `admin@ssbw.local`
- Password: `Admin123!`

## Scripts útiles

- `npm run dev`: arranca en modo desarrollo con nodemon
- `npm run start`: arranca en modo normal
- `npm run db:push`: sincroniza esquema Prisma con la base de datos
- `npm run prisma:studio`: abre Prisma Studio
- `npm run scrape`: ejecuta scraping y genera `data/kiwoko-products.json`

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

## Pruebas API con REST Client

Se incluye el archivo `test-api.http` en la raiz para ejecutar pruebas desde la extension REST Client de VS Code.

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
