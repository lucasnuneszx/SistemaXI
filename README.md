# SistemaXI

CRM interno para gestão de projetos, atividades, funil de vendas, propostas, relatórios diários e financeiro da equipe.

## Stack

- Frontend: Next.js 14, React, TypeScript, Tailwind CSS, shadcn/ui
- Backend: FastAPI, SQLAlchemy, PostgreSQL (SQLite em desenvolvimento)
- Arquivos: MinIO (compatível com S3)
- Autenticação: JWT
- Deploy: Railway (frontend pela raiz, backend em `fastapi-backend/`)

## Rodando localmente

Requisitos: Node.js 18+, Python 3.11+.

```bash
./install.sh
```

Ou manualmente:

```bash
# frontend
npm install
cp env.example .env.local
npm run dev                 # http://localhost:3000

# backend
cd fastapi-backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python run.py               # http://localhost:3001 (docs em /docs)
```

Na primeira inicialização o backend cria as tabelas e um usuário admin padrão se o banco estiver vazio. Troque a senha depois do primeiro login.

## Variáveis de ambiente

Frontend:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_API_BASE_URL`
- `BACKEND_URL` (usada pelo proxy em `/api/proxy`)

Backend:

- `DATABASE_URL`
- `JWT_SECRET_KEY`, `JWT_ALGORITHM`, `JWT_ACCESS_TOKEN_EXPIRE_MINUTES`
- `ENVIRONMENT`
- `CORS_ORIGINS`, `FRONTEND_URL`
- `INIT_DATABASE_SECRET` (protege `/api/init-database`)
- `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET_NAME`, `MINIO_USE_SSL`
- `PORT` (definida pelo Railway)

## Estrutura

```
src/
  app/           rotas do Next (área logada em (protected)/, proxy em api/proxy)
  components/    componentes por módulo (funil-vendas, finance, propostas...) e ui/
  config/        URLs e endpoints da API
  context/       AuthContext e FunilVendasContext
fastapi-backend/
  app/
    api/v1/      endpoints
    models/      modelos SQLAlchemy
    schemas/     schemas Pydantic
    services/    regras de negócio
    core/        config, banco e segurança
  migrations/    scripts SQL/Python avulsos
  ensure_all_tables.py  verifica e cria tabelas faltantes
  check_tables.py       lista as tabelas existentes no banco
```
