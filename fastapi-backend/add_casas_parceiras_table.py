#!/usr/bin/env python3
"""
Script para adicionar tabela de casas parceiras
"""
from sqlalchemy import text
from app.core.database import engine

def add_casas_parceiras_table():
    """Add casas_parceiras table to database"""
    print("Adicionando tabela de casas parceiras...")
    
    try:
        with engine.connect() as connection:
            with connection.begin():
                print("Criando tabela casas_parceiras...")
                connection.execute(text("""
                    CREATE TABLE IF NOT EXISTS casas_parceiras (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        nome VARCHAR(255) NOT NULL,
                        slug VARCHAR(255) NOT NULL UNIQUE,
                        logo_url VARCHAR(500),
                        link_base VARCHAR(1000) NOT NULL,
                        codigo_afiliado VARCHAR(255),
                        utm_source VARCHAR(255),
                        utm_medium VARCHAR(255),
                        utm_campaign VARCHAR(255),
                        canais_config JSONB,
                        ativo BOOLEAN DEFAULT TRUE,
                        projeto_id UUID NOT NULL,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        CONSTRAINT fk_casas_parceiras_projeto_id 
                            FOREIGN KEY (projeto_id) REFERENCES projects(id) 
                            ON DELETE CASCADE
                    );
                """))
                
                print("Criando índices...")
                connection.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_casas_parceiras_projeto_id 
                    ON casas_parceiras(projeto_id);
                """))
                
                connection.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_casas_parceiras_slug 
                    ON casas_parceiras(slug);
                """))
                
                print("Criando trigger para updated_at...")
                connection.execute(text("""
                    CREATE OR REPLACE FUNCTION update_updated_at_column()
                    RETURNS TRIGGER AS $$
                    BEGIN
                        NEW.updated_at = NOW();
                        RETURN NEW;
                    END;
                    $$ language 'plpgsql';
                """))
                
                connection.execute(text("""
                    DROP TRIGGER IF EXISTS update_casas_parceiras_updated_at ON casas_parceiras;
                    CREATE TRIGGER update_casas_parceiras_updated_at
                        BEFORE UPDATE ON casas_parceiras
                        FOR EACH ROW
                        EXECUTE FUNCTION update_updated_at_column();
                """))
                
        print("Tabela casas_parceiras criada com sucesso!")
        print("Agora você pode gerenciar casas parceiras e gerar links com UTM!")
        return True
        
    except Exception as e:
        print(f"Erro ao criar tabela casas_parceiras: {e}")
        return False

if __name__ == "__main__":
    add_casas_parceiras_table() 