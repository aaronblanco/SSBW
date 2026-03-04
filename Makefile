install:
	npm install

db-up:
	docker compose up -d postgres

db-down:
	docker compose down

db-push:
	npm run db:push

dev:
	npm run dev

start:
	npm run start

scrape:
	npm run scrape
