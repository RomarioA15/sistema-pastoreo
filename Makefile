.PHONY: help install dev test lint format clean docker-build docker-up docker-down

help:
	@echo "Comandos disponibles:"
	@echo "  install     - Instalar dependencias Python y Node.js"
	@echo "  dev         - Ejecutar en modo desarrollo"
	@echo "  test        - Ejecutar tests"
	@echo "  lint        - Ejecutar linting"
	@echo "  format      - Formatear código con black"
	@echo "  build       - Construir assets para producción"
	@echo "  clean       - Limpiar archivos temporales"
	@echo "  docker-build - Construir imagen Docker"
	@echo "  docker-up   - Levantar servicios con docker-compose"
	@echo "  docker-down - Bajar servicios docker-compose"

install:
	pip install -r requirements.txt
	npm install

dev:
	python run.py

test:
	pytest -v

lint:
	flake8 .
	black --check .

format:
	black .

build:
	npm run build

clean:
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	rm -rf proyecto/static/dist
	rm -rf node_modules/.cache

docker-build:
	docker build -t pastoreo-web .

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down