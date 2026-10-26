#!/bin/bash
set -e

echo "Instalando dependências do frontend..."
npm install

echo "Instalando dependências do backend..."
cd fastapi-backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
cd ..

echo "Instalação concluída."
echo "Backend: cd fastapi-backend && source venv/bin/activate && python run.py"
echo "Frontend: npm run dev"
