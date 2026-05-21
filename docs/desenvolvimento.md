# Guia de desenvolvimento

> Como configurar o ambiente, rodar a aplicação, executar os testes e resolver os problemas mais comuns.

## Sumário

- [Pré-requisitos](#pré-requisitos)
- [Configuração inicial](#configuração-inicial)
- [Backend](#backend)
- [Frontend](#frontend)
- [Testes](#testes)
- [Migrações de banco](#migrações-de-banco)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Padrões de qualidade](#padrões-de-qualidade)
- [Troubleshooting](#troubleshooting)

---

## Pré-requisitos

| Ferramenta | Versão | Para quê |
|---|---|---|
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | recente | Subir a API e o PostgreSQL |
| [Node.js](https://nodejs.org/) | 22+ | Rodar o frontend |
| [Git](https://git-scm.com/) | recente | Clonar o repositório |

O backend roda inteiramente em contêineres — **não é preciso instalar Python nem PostgreSQL** na máquina.

---

## Configuração inicial

```bash
git clone https://github.com/jgabrielflores/marcenaria-api.git
cd marcenaria-api
cp .env.example .env
```

Abra o `.env` e preencha os valores. No mínimo:

- `SECRET_KEY` — gere com `python -c "import secrets; print(secrets.token_hex(32))"`
- `ADMIN_EMAIL` e `ADMIN_PASSWORD` — credenciais do administrador inicial
- `ENV=development` — habilita logs em texto legível

> A referência completa das variáveis está no [README principal](../README.md#variáveis-de-ambiente).

---

## Backend

### Subir o ambiente

```bash
# Sobe a API (porta 8000) e o PostgreSQL (porta 5432)
docker-compose up -d

# Aplica as migrações de schema
docker-compose exec api alembic upgrade head

# Cria a conta de administrador inicial (idempotente)
docker-compose exec api python -m src.scripts.seed_admin
```

| Serviço | Endereço |
|---|---|
| API | http://localhost:8000 |
| Documentação interativa (Swagger) | http://localhost:8000/docs |
| Health check | http://localhost:8000/health |

### Comandos úteis

```bash
# Ver os logs da API em tempo real
docker-compose logs -f api

# Reiniciar a API (necessário após mudar código Python — veja a nota abaixo)
docker-compose restart api

# Derrubar tudo (mantém os dados do banco)
docker-compose down

# Derrubar tudo e apagar o volume do banco (recomeço do zero)
docker-compose down -v
```

> [!IMPORTANT]
> O `uvicorn` roda **sem `--reload`**. Toda alteração em código Python só tem efeito após `docker-compose restart api`.

---

## Frontend

```bash
cd frontend
cp .env.local.example .env.local   # define NEXT_PUBLIC_API_URL=http://localhost:8000
npm install
npm run dev                        # http://localhost:3000
```

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento com *hot reload* |
| `npm run build` | Build de produção |
| `npm run start` | Sobe o build de produção |
| `npm run lint` | Verificação de lint (ESLint) |
| `npx tsc --noEmit` | Verificação de tipos TypeScript |

---

## Testes

A suíte tem **133 testes** em três níveis. Todos rodam dentro do contêiner da API.

```bash
# Todos os testes com relatório de cobertura
docker-compose exec api pytest --cov=src --cov-report=term-missing

# Apenas unitários (rápidos — sem banco, sem HTTP)
docker-compose exec api pytest -m unit -v

# Apenas integração (ciclo HTTP completo + banco de teste real)
docker-compose exec api pytest -m integration -v

# Apenas segurança (cenários adversariais)
docker-compose exec api pytest -m security -v

# Um único arquivo
docker-compose exec api pytest tests/unit/test_order_service.py -v

# Um único teste pelo nome
docker-compose exec api pytest -k "test_login_with_wrong_password" -v
```

| Tipo | Marcador | Banco | HTTP | O que cobre |
|---|---|:---:|:---:|---|
| Unitário | `unit` | — | — | Lógica pura: services, validadores, máquina de estados |
| Integração | `integration` | real | ✓ | Ciclo completo de requisição/resposta |
| Segurança | `security` | real | ✓ | Ataques: JWT, IDOR, SQL injection, força bruta |

**Cobertura:** linha de base ~91% sobre `src/`. A CI bloqueia *merge* abaixo de 70%.

---

## Migrações de banco

O schema é versionado com **Alembic** — nunca é alterado manualmente nem por `create_all`.

```bash
# Aplicar todas as migrações pendentes
docker-compose exec api alembic upgrade head

# Gerar uma migração após alterar um modelo em src/models/
docker-compose exec api alembic revision --autogenerate -m "descrição da mudança"

# Reverter a última migração
docker-compose exec api alembic downgrade -1

# Ver o estado atual
docker-compose exec api alembic current
```

Depois de gerar uma migração com `--autogenerate`, **revise o arquivo** em `migrations/versions/` antes de aplicá-lo — o Alembic acerta a maior parte, mas nem sempre tudo.

---

## Estrutura de pastas

```
marcenaria-api/
├── src/                      # API REST — FastAPI
│   ├── main.py               # App factory
│   ├── config.py             # Settings (pydantic-settings)
│   ├── database.py           # Engine + sessão
│   ├── dependencies.py       # get_current_user · require_admin
│   ├── limiter.py            # Rate limiter
│   ├── models/               # Modelos ORM
│   ├── schemas/              # DTOs Pydantic
│   ├── routers/              # Handlers HTTP
│   ├── services/             # Regras de negócio
│   └── scripts/              # seed_admin
│
├── frontend/                 # Interface web — Next.js 16
│   ├── app/                  # Rotas (App Router)
│   ├── components/           # Componentes de UI
│   ├── lib/                  # api · auth · theme · constants
│   └── proxy.ts              # Guarda de rotas
│
├── migrations/               # Migrações Alembic
├── tests/                    # unit · integration · security
├── docs/                     # Esta documentação
├── docker-compose.yml        # Orquestração local
├── Dockerfile                # Imagem da API
├── pyproject.toml            # Dependências e config do projeto Python
└── .github/workflows/ci.yml  # Pipeline de CI
```

---

## Padrões de qualidade

| Princípio | Como se aplica aqui |
|---|---|
| **Arquitetura em camadas** | `routers → services → models`, sem cruzar fronteiras |
| **Sem *magic strings*** | Constantes nomeadas (ex.: `frontend/lib/constants.ts`) |
| **Sem código morto** | Código não usado é removido, não comentado |
| **Sem solução temporária silenciosa** | Toda gambiarra é sinalizada explicitamente como dívida técnica |
| **Testes como cidadãos de primeira classe** | Funcionalidade sem teste não está pronta |
| **Convenção de idioma** | Código em inglês; texto de UI em português |

O fluxo de trabalho do projeto inclui revisões automatizadas: revisão de simplificação após editar o backend, revisão de código ao fechar cada fase e revisão de segurança obrigatória antes de qualquer *deploy*.

---

## Troubleshooting

### A API não sobe / erro de conexão com o banco

O contêiner da API espera o PostgreSQL ficar saudável (`healthcheck` no `docker-compose.yml`). Se mesmo assim falhar:

```bash
docker-compose logs db      # verifique se o banco subiu
docker-compose restart api  # reinicie a API
```

### "relation does not exist" ao chamar a API

As migrações não foram aplicadas:

```bash
docker-compose exec api alembic upgrade head
```

### Mudei o código Python e nada mudou

O `uvicorn` roda sem `--reload`. Reinicie o contêiner:

```bash
docker-compose restart api
```

### Onde está o link de verificação de e-mail em desenvolvimento?

Sem `SMTP_HOST` configurado, o link é impresso no log do backend:

```bash
docker-compose logs api | grep "Verification link"
```

### Não consigo fazer login mesmo com a senha certa

A conta provavelmente está com o e-mail não verificado (resposta `403 EMAIL_NOT_VERIFIED`). Verifique o e-mail pelo link no log, ou — para a conta de admin — rode o `seed_admin`, que já marca o e-mail como verificado.

### Quero recomeçar com o banco limpo

```bash
docker-compose down -v          # apaga o volume do banco
docker-compose up -d
docker-compose exec api alembic upgrade head
docker-compose exec api python -m src.scripts.seed_admin
```

### O frontend não conversa com a API (erro de CORS)

Confira se `FRONTEND_ORIGIN` no `.env` do backend é exatamente a origem do frontend (`http://localhost:3000`) e se `NEXT_PUBLIC_API_URL` no `.env.local` aponta para a API (`http://localhost:8000`).

---

Veja também: **[arquitetura.md](arquitetura.md)** · **[api.md](api.md)** · **[modelo-de-dados.md](modelo-de-dados.md)**.
