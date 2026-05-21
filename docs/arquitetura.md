# Arquitetura

> Visão arquitetural da plataforma: estrutura do monorepo, camadas da API, fluxos de requisição e topologia de deploy.

## Sumário

- [Visão macro](#visão-macro)
- [Monorepo](#monorepo)
- [Arquitetura em camadas da API](#arquitetura-em-camadas-da-api)
- [Fluxos de requisição](#fluxos-de-requisição)
- [Arquitetura do frontend](#arquitetura-do-frontend)
- [Topologia de deploy](#topologia-de-deploy)
- [Decisões arquiteturais](#decisões-arquiteturais)

---

## Visão macro

A plataforma é composta por três peças que se comunicam por contratos bem definidos:

```mermaid
flowchart TD
    subgraph cliente["Camada de apresentação"]
        Browser["Navegador<br/>cliente · admin · visitante"]
    end

    subgraph web["frontend/ — Next.js 16"]
        Landing["Site institucional<br/>/"]
        Portal["Portal do cliente<br/>/conta/*"]
        Admin["Painel admin<br/>/admin/*"]
        Proxy["proxy.ts<br/>guarda de rotas"]
    end

    subgraph api["src/ — FastAPI"]
        Routers["Routers"]
        Services["Services"]
        Models["Models / ORM"]
    end

    DB[("PostgreSQL 16")]
    SMTP["SMTP<br/>(opcional)"]

    Browser --> Proxy
    Proxy --> Landing & Portal & Admin
    Landing & Portal & Admin -->|"JSON / REST · CORS"| Routers
    Routers --> Services
    Services --> Models
    Models -->|SQLAlchemy| DB
    Services -.->|verificação de e-mail| SMTP

    classDef edge fill:#1a1a1a,stroke:#1a1a1a,color:#fff
    classDef core fill:#009688,stroke:#00695c,color:#fff
    classDef store fill:#4169E1,stroke:#2a47b8,color:#fff
    class Browser,Landing,Portal,Admin,Proxy edge
    class Routers,Services,Models core
    class DB,SMTP store
```

| Componente | Responsabilidade |
|---|---|
| **frontend/** | Renderizar a interface, gerir sessão no navegador, guardar rotas por papel |
| **src/** | Autenticar, aplicar regras de negócio, persistir dados, expor a API REST |
| **PostgreSQL** | Persistência durável — usuários, pedidos e histórico de status |
| **SMTP** | Envio de e-mails de verificação de conta (opcional em desenvolvimento) |

---

## Monorepo

O repositório `marcenaria-api` reúne **dois deployáveis independentes** que evoluem e são publicados separadamente:

```
marcenaria-api/
├── src/        → API REST       → deploy: AWS ECS/Fargate + RDS
└── frontend/   → Interface web  → deploy: Vercel
```

**Por que monorepo:** mantém o contrato de API (tipos TypeScript em `frontend/lib/api.ts` que espelham os schemas Pydantic em `src/schemas/`) sincronizado em um único histórico de versão, sem o atrito de coordenar dois repositórios.

---

## Arquitetura em camadas da API

A API segue **arquitetura em camadas** (*layered architecture*) com fluxo de dependência unidirecional. Cada camada só conhece a camada imediatamente abaixo.

```mermaid
flowchart TB
    HTTP["Requisição HTTP"]
    Dep["dependencies.py<br/>get_current_user · require_admin"]
    Router["routers/<br/>parse HTTP · valida via schema · delega"]
    Schema["schemas/<br/>DTOs Pydantic — validação de entrada/saída"]
    Service["services/<br/>regras de negócio · orquestração"]
    Model["models/<br/>schema do banco — SQLAlchemy ORM"]
    DB[("PostgreSQL")]

    HTTP --> Dep
    Dep --> Router
    Router <--> Schema
    Router --> Service
    Service --> Model
    Model --> DB

    classDef l fill:#f5f5f5,stroke:#888,color:#1a1a1a
    classDef io fill:#009688,stroke:#00695c,color:#fff
    class Dep,Router,Schema,Service,Model l
    class HTTP,DB io
```

### Responsabilidades e fronteiras

| Camada | Arquivo(s) | Faz | **Nunca faz** |
|---|---|---|---|
| **Dependências** | `dependencies.py` | Resolve o usuário do JWT, aplica `require_admin` | Regra de negócio |
| **Routers** | `routers/*.py` | Recebe HTTP, valida entrada (Pydantic), delega ao service, monta a resposta | Acessa o banco, contém regra de negócio |
| **Schemas** | `schemas/*.py` | Define DTOs de entrada/saída, valida e normaliza campos | Referencia modelos ORM diretamente |
| **Services** | `services/*.py` | Concentra a regra de negócio, orquestra operações no ORM | Importa de `routers/`, lida com objetos HTTP |
| **Models** | `models/*.py` | Define o schema do banco (tabelas, colunas, índices) | Contém lógica de negócio |

> **Regra de ouro:** a camada de serviço não conhece HTTP. Ela recebe objetos de domínio e parâmetros simples, e levanta `HTTPException` apenas para sinalizar violações de regra de negócio. Isso a torna testável de forma isolada — veja os testes unitários em `tests/unit/`.

### Anatomia de um endpoint

O endpoint `POST /api/v1/orders` ilustra a separação:

```python
# routers/orders.py — fino: valida, delega, serializa
@router.post("", status_code=201, response_model=OrderRead)
def create(body: OrderCreate, db: Session = Depends(get_db),
           current_user: User = Depends(get_current_user)) -> OrderRead:
    order = order_service.create_order(db, current_user, body)
    return order_service.serialize_order(order, viewer_is_admin=current_user.is_admin)
```

- `OrderCreate` (schema) já validou e normalizou WhatsApp, CEP e UF **antes** de o código do router rodar.
- `create_order` (service) aplica a regra: status inicial `AGUARDANDO_ANALISE` + primeira linha no histórico.
- `serialize_order` (service) monta a resposta redigindo campos conforme o papel de quem visualiza.

---

## Fluxos de requisição

### Fluxo 1 — Autenticação e criação de pedido

```mermaid
sequenceDiagram
    actor C as Cliente
    participant F as Frontend
    participant A as API (FastAPI)
    participant DB as PostgreSQL

    C->>F: preenche login
    F->>A: POST /auth/login
    A->>DB: busca usuário por e-mail
    A->>A: verifica hash bcrypt + e-mail verificado
    A-->>F: 200 { access_token }
    F->>F: saveSession(token) — cookie + localStorage

    C->>F: preenche novo pedido
    F->>A: POST /api/v1/orders (Bearer token)
    A->>A: get_current_user — decodifica JWT
    A->>A: OrderCreate — valida e normaliza CEP/WhatsApp
    A->>DB: INSERT order + INSERT order_status_history
    A-->>F: 201 OrderRead (redigido por papel)
```

### Fluxo 2 — Avanço de status pelo admin

```mermaid
sequenceDiagram
    actor Adm as Admin
    participant F as Frontend
    participant A as API
    participant DB as PostgreSQL

    Adm->>F: seleciona novo status
    F->>A: PATCH /api/v1/orders/{id} (Bearer token)
    A->>A: require_admin — bloqueia não-admin (403)
    A->>DB: SELECT order
    A->>A: is_valid_transition(atual, novo)?
    alt transição inválida
        A-->>F: 409 Conflict
    else campos obrigatórios ausentes
        A-->>F: 400 Bad Request
    else transição válida
        A->>DB: UPDATE order.status
        A->>DB: INSERT order_status_history
        A-->>F: 200 OrderRead
    end
```

### Fluxo 3 — Verificação de e-mail

```mermaid
sequenceDiagram
    actor C as Cliente
    participant A as API
    participant M as SMTP / Log
    participant DB as PostgreSQL

    C->>A: POST /auth/register
    A->>DB: INSERT user (email_verified = false)
    A->>A: create_verification_token (JWT, 24 h)
    A->>M: envia link de verificação<br/>(ou imprime no log se sem SMTP)
    A-->>C: 201 UserRead

    C->>A: GET /auth/verify?token=...
    A->>A: decodifica e valida token (purpose + exp)
    A->>DB: UPDATE user.email_verified = true
    A-->>C: 303 redirect /login?verified=1
```

---

## Arquitetura do frontend

O frontend usa **Next.js 16 com App Router** — arquitetura *server-first*, em que componentes rodam no servidor por padrão e só recebem `"use client"` quando precisam de estado, eventos ou APIs do navegador.

```
frontend/app/
├── page.tsx              # / — site institucional (server component)
├── login · register      # autenticação (useActionState)
├── conta/                # área do cliente — exige JWT + e-mail verificado
│   ├── pedidos/          # lista · novo · detalhe
│   └── perfil/           # editar nome · trocar senha
└── admin/                # painel admin — exige JWT com role ADMIN
    ├── page.tsx          # dashboard
    └── pedidos/          # lista · novo · detalhe/gestão
```

### Camada de acesso à API e sessão

| Módulo | Responsabilidade |
|---|---|
| `lib/api.ts` | Funções de *fetch* tipadas + classe `ApiError` + tipos espelhados da API |
| `lib/auth.ts` | `saveSession` · `clearSession` · `getToken` · `getUser` · `isAdmin` |
| `lib/constants.ts` | Chaves de armazenamento (`TOKEN_KEY`, `USER_KEY`) — nunca *hardcoded* |
| `proxy.ts` | Guarda de rotas (middleware do Next.js 16) |

### Guarda de rotas

`proxy.ts` intercepta toda navegação **antes** da renderização:

```mermaid
flowchart TD
    Req["Requisição de rota"]
    Pub{"Rota pública?<br/>/ · /login · /register"}
    Tok{"Tem token?"}
    AdminR{"Rota /admin/* ?"}
    Role{"role = ADMIN?"}
    OK["Renderiza a página"]
    Login["Redireciona → /login"]
    Conta["Redireciona → /conta/pedidos"]

    Req --> Pub
    Pub -->|sim| OK
    Pub -->|não| Tok
    Tok -->|não| Login
    Tok -->|sim| AdminR
    AdminR -->|não| OK
    AdminR -->|sim| Role
    Role -->|sim| OK
    Role -->|não| Conta
```

O papel é lido diretamente do *payload* do JWT — sem chamada de API. É uma guarda de **navegação** (UX); a autorização real é sempre reaplicada no servidor pela API.

---

## Topologia de deploy

Os dois deployáveis seguem para destinos distintos, cada um adequado ao seu perfil de carga:

```mermaid
flowchart LR
    User["Usuário"]

    subgraph vercel["Vercel"]
        Next["Next.js 16<br/>frontend/"]
    end

    subgraph aws["AWS"]
        ALB["Load Balancer"]
        ECS["ECS / Fargate<br/>contêiner da API"]
        RDS[("RDS<br/>PostgreSQL 16")]
    end

    User -->|HTTPS| Next
    Next -->|HTTPS / REST| ALB
    ALB --> ECS
    ECS --> RDS

    classDef v fill:#000,stroke:#000,color:#fff
    classDef a fill:#FF9900,stroke:#cc7a00,color:#1a1a1a
    class Next v
    class ALB,ECS,RDS a
```

| Deployável | Destino | Justificativa |
|---|---|---|
| `frontend/` | **Vercel** | Integração nativa com Next.js, CDN global, *preview deploys* por *branch* |
| `src/` | **AWS ECS/Fargate** | Contêineres sem gerenciar servidores; escala horizontal sob demanda |
| Banco | **AWS RDS PostgreSQL 16** | Banco gerenciado — *backups*, *failover* e *patching* automáticos |

O contêiner da API já está pronto para esse cenário: o `Dockerfile` produz uma imagem enxuta (Python 3.12-slim), roda como **usuário não-root** e lê toda a configuração do ambiente (princípio 12-factor).

> O deploy automatizado em AWS é um item do [roadmap](../README.md#roadmap). Hoje o pipeline de CI valida testes e cobertura a cada *push*.

---

## Decisões arquiteturais

| Decisão | Alternativa considerada | Por que esta escolha |
|---|---|---|
| Arquitetura em camadas | Lógica direto nos *routers* | Isola a regra de negócio, deixa o *service* testável sem HTTP/banco |
| Monorepo | Dois repositórios | Mantém o contrato de API versionado junto, sincronizado |
| JWT *stateless* | Sessão em servidor | API sem estado escala horizontalmente sem *sticky sessions* |
| Histórico *append-only* | Campo `updated_by` mutável | Trilha de auditoria completa + base para métricas temporais |
| ORM exclusivo (sem SQL bruto) | SQL escrito à mão | Elimina superfície de SQL injection; *queries* tipadas |
| Serialização sensível a papel | Endpoints separados admin/cliente | Uma fonte de verdade; redação centralizada em `serialize_order` |
| Migrações com Alembic | `create_all` automático | Schema versionado e auditável; *upgrades* reproduzíveis |

Veja também: **[modelo-de-dados.md](modelo-de-dados.md)** · **[regras-de-negocio.md](regras-de-negocio.md)** · **[seguranca.md](seguranca.md)**.
