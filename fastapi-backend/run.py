#!/usr/bin/env python3
"""
Script para executar o servidor FastAPI em modo desenvolvimento
"""
import uvicorn
from app.core.config import settings

if __name__ == "__main__":
    print("Iniciando FastAPI Server...")
    print(f"API será executada em: http://localhost:3001")
    print(f"Documentação em: http://localhost:3001/docs")
    print("Para parar o servidor: Ctrl+C")
    print("-" * 50)
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=3001,
        reload=True,
        log_level="info"
    ) 