.PHONY: up down build install migrate run-backend run-frontend run-channel

up:
	docker-compose up -d

down:
	docker-compose down

build:
	docker-compose build

install:
	cd backend && pip install -r requirements.txt
	cd channel-service && pip install -r requirements.txt
	cd frontend && npm install

run-backend:
	cd backend && uvicorn app.main:app --reload --port 8000

run-channel:
	cd channel-service && uvicorn main:app --reload --port 8001

run-frontend:
	cd frontend && npm run dev
