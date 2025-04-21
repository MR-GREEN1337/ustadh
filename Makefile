.PHONY: install backend web mobile worker beat all stop

install:
	@echo "Installing dependencies for all services"
	pip install poetry
	cd backend && poetry install
	cd frontend && npm install
	cd mobile && npm install

all:
	backend web worker

backend:
	@echo "Starting backend"
	cd backend && python3.13 -m uvicorn src.main:app --reload --port 8000 --proxy-headers --forwarded-allow-ips "*" &

worker:
	@echo "Starting Celery worker"
	cd backend && python3.13 -m celery -A src.worker.celery_app worker --loglevel=info &

beat:
	@echo "Starting Celery beat scheduler"
	cd backend && python3.13 -m celery -A src.worker.celery_app beat --loglevel=info &

mobile:
	@echo "Starting mobile service"
	cd mobile && npx expo start &

web:
	@echo "Starting web"
	cd web && npm run dev &

stop:
	@echo "Stopping all services"
	@echo "Stopping backend"
	-pkill -f 'uvicorn.*8000'

	@echo "Stopping Celery worker"
	-pkill -f 'celery.*worker'

	@echo "Stopping Celery beat"
	-pkill -f 'celery.*beat'

	@echo "Stopping web"
	-pkill -f 'node.*web'

	@echo "Stopping mobile"
	-pkill -f 'uvicorn.*8001'
	-pkill -f 'node.*mobile'

	@echo "\033[1;32m🛑🛑🛑 Everything stopped\033[0m"

# Development helpers
redis:
	@echo "Starting Redis container for development"
	docker run -d --name edtech-redis -p 6379:6379 redis:alpine

redis-stop:
	@echo "Stopping Redis container"
	-docker stop edtech-redis
	-docker rm edtech-redis

dev: redis backend worker web
	@echo "\033[1;32m🚀🚀🚀 Development environment running\033[0m"

dev-stop: stop redis-stop
	@echo "\033[1;32m🛑🛑🛑 Development environment stopped\033[0m"
