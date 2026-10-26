#!/bin/bash
set -e

echo "Configurando ambiente de build..."

# Instalar dependências do frontend (se necessário)
if [ -f "../package.json" ]; then
    echo "Instalando dependências do frontend..."
    cd ..
    npm install --legacy-peer-deps || true
    cd fastapi-backend
fi

# Instalar dependências do backend
echo "Instalando dependências do backend..."
pip install --upgrade pip
pip install -r requirements.txt

echo "Build concluído!"

