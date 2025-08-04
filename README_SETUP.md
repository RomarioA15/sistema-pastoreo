# Setup y Comandos de Desarrollo

## Instalación Rápida

```bash
# Instalar dependencias
make install

# O manualmente:
pip install -r requirements.txt
npm install
```

## Comandos de Desarrollo

```bash
# Desarrollo local
make dev
# o: python run.py

# Tests
make test

# Linting y formato
make lint
make format

# Construir assets
make build
```

## Docker

```bash
# Desarrollo con Docker
make docker-up

# Parar servicios
make docker-down
```

## Pre-commit Hooks

```bash
# Instalar hooks
pre-commit install

# Ejecutar manualmente
pre-commit run --all-files
```

## Producción

```bash
# Con Gunicorn
./start_production.sh

# Variables de entorno necesarias:
# FLASK_ENV=production
# REDIS_HOST=localhost
# REDIS_PORT=6379
```