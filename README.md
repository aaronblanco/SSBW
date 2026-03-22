# SSBW - Hito 1 (Express + MVC + Scraping + PostgreSQL + Prisma)

Backend en Express siguiendo MVC, preparado para servir API REST a web y Android (Kotlin).

## Estructura MVC

- `src/routes`: definición de endpoints.
- `src/controllers`: manejo HTTP (request/response).
- `src/services`: lógica de negocio.
- `src/repositories`: acceso a datos con Prisma.
- `src/scraper`: extracción de productos con Playwright.

## Stack de persistencia

- PostgreSQL en Docker Compose (`docker-compose.yml`).
- ORM Prisma (`prisma/schema.prisma`).

## Requisitos

- Node.js 20+
- Docker Desktop (o motor Docker compatible)

## Setup rápido

1. Instalar dependencias:

```bash
npm install
```

2. Copiar variables de entorno (en Windows PowerShell):

```bash
Copy-Item .env.example .env
```

3. Levantar PostgreSQL:

```bash
docker compose up -d postgres
```

Si ya tienes un PostgreSQL local en el puerto `5432`, este proyecto usa `5433` para el contenedor.

4. Aplicar el esquema Prisma en la BD:

```bash
npm run db:push
```

5. Iniciar backend:

```bash
npm run dev
```

## Endpoints

- `GET /` página de búsquedas (Bootstrap).
- `GET /health`
- `GET /api/products` lista productos guardados en PostgreSQL.
	- Query params: `search`, `take`, `skip`
- `POST /api/products/scrape/kiwoko` scrapea y guarda (upsert por URL).
	- Query/body opcionales: `maxPages`, `headless`
- `GET /api/products/scrape/kiwoko` igual que el anterior (útil para pruebas rápidas).
- Compatibilidad antigua: `GET /api/scrape/kiwoko`

### Auth (web + Android)

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

El backend emite un JWT y soporta dos modos a la vez:

- Web: cookie `httpOnly` (`access_token`).
- Android/API clients: header `Authorization: Bearer <token>`.

Variable recomendada en `.env`:

```env
JWT_SECRET=pon_aqui_un_secreto_largo
```

## Protocolos

- HTTP: API REST + página de búsqueda Bootstrap.
- WebSocket: `GET /ws` para eventos en vivo (por ejemplo `scrape-completed`).

## Script CLI

```bash
npm run scrape
```

Este comando ahora:

- scrapea productos,
- los guarda en PostgreSQL con Prisma,
- y además genera `data/kiwoko-products.json`.

## Nota

Respeta siempre los términos de uso y el `robots.txt` de la web objetivo.
