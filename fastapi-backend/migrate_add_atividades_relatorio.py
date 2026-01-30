"""
Script de migração para adicionar relacionamento many-to-many entre relatórios diários e atividades
"""

import psycopg2
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

# Configurações do banco (usando credenciais do production)
DB_CONFIG = {
    'host': '78.142.242.97',
    'port': 5432,
    'database': 'squad',
    'user': 'fortis',
    'password': 'SENHA_REMOVIDA'
}

def run_migration():
    """Executa a migração"""
    conn = None
    cursor = None
    try:
        # Conectar ao banco
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        print("🚀 Iniciando migração: Adicionar relacionamento relatórios-atividades...")
        
        # Criar tabela de associação
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS relatorio_atividade_association (
                relatorio_id UUID NOT NULL,
                atividade_id UUID NOT NULL,
                PRIMARY KEY (relatorio_id, atividade_id),
                FOREIGN KEY (relatorio_id) REFERENCES relatorios_diarios(id) ON DELETE CASCADE,
                FOREIGN KEY (atividade_id) REFERENCES atividades(id) ON DELETE CASCADE
            );
        """)
        
        # Criar índices para melhor performance
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_relatorio_atividade_relatorio_id 
            ON relatorio_atividade_association(relatorio_id);
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_relatorio_atividade_atividade_id 
            ON relatorio_atividade_association(atividade_id);
        """)
        
        # Confirmar transação
        conn.commit()
        
        print("✅ Migração executada com sucesso!")
        print("   - Tabela 'relatorio_atividade_association' criada")
        print("   - Índices criados para melhor performance")
        
    except Exception as e:
        print(f"❌ Erro durante a migração: {e}")
        if conn:
            conn.rollback()
        raise
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    run_migration() 