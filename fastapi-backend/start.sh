#!/bin/bash
set -e

# Obter porta do ambiente ou usar padrão
PORT=${PORT:-3001}

echo "Iniciando FastAPI na porta $PORT..."

# Executar uvicorn
exec uvicorn app.main:app --host 0.0.0.0 --port $PORT

