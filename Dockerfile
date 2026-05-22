FROM node:20-bookworm-slim AS web-builder

WORKDIR /app/web

COPY web/package*.json ./
RUN npm ci

COPY web ./
RUN npm run build

FROM node:22-bookworm-slim AS astro-builder

WORKDIR /app/astro

COPY astro/package*.json ./
RUN npm ci

COPY astro ./
RUN npm run build

FROM node:20-bookworm-slim

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci \
  && npx prisma generate \
  && npx playwright install --with-deps chromium \
  && npm cache clean --force

COPY src ./src
COPY public ./public
COPY --from=web-builder /app/web/dist ./web/dist
COPY --from=astro-builder /app/astro/dist ./astro/dist

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "run", "start:cloud"]
