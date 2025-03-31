.PHONY: install backend web mobile all stop

install:
	@echo "Installing dependencies for all services"
	pip install poetry
	cd backend && poetry install
	cd frontend && npm install
all:
	frontend backend

backend:
	@echo "Starting backend"
	cd backend && python3.13 -m uvicorn src.main:app --reload --port 8000 --proxy-headers --forwarded-allow-ips "*" &

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

	@echo "Stopping frontend"
	-pkill -f 'node.*frontend'

	@echo "Stopping mobile"
	-pkill -f 'uvicorn.*8001'

	@echo "\033[1;32m🛑🛑🛑 Everything stopped\033[0m"
