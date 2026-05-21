# Referência da API REST

> Contrato completo da API. A especificação canônica e interativa (OpenAPI/Swagger) é gerada automaticamente e fica em **`/docs`** quando a API está no ar.

- **Base local:** `http://localhost:8000`
- **Formato:** JSON em requisições e respostas
- **Autenticação:** *Bearer token* JWT no cabeçalho `Authorization`
- **Versionamento:** endpoints de domínio sob o prefixo `/api/v1`

## Sumário

- [Convenções](#convenções)
- [Autenticação](#autenticação)
- [Endpoints — Auth](#endpoints--auth)
- [Endpoints — Perfil](#endpoints--perfil)
- [Endpoints — Pedidos](#endpoints--pedidos)
- [Endpoints — Admin](#endpoints--admin)
- [Endpoints — Health](#endpoints--health)
- [Modelos de dados](#modelos-de-dados)
- [Códigos de status](#códigos-de-status)
- [Tratamento de erros](#tratamento-de-erros)

---

## Convenções

### Autenticação por JWT

Endpoints protegidos exigem o cabeçalho:

```
Authorization: Bearer <access_token>
```

O token é obtido em `POST /auth/login`. O *payload* JWT carrega `sub` (UUID do usuário), `role` e `exp`. Validade padrão: **24 horas**. Não há *refresh token* — ao expirar, é necessário autenticar novamente.

### Paginação

Endpoints de listagem aceitam `page` e `limit` por *query string* e devolvem um envelope padronizado:

```jsonc
{
  "items": [ /* ... */ ],
  "total": 48,     // total de registros que casam com o filtro
  "page": 1,       // página atual
  "limit": 20,     // itens por página
  "pages": 3       // total de páginas
}
```

### Campos monetários

Valores em dinheiro (`project_value`, `estimated_cost`, `profit`, `revenue_month`, ...) trafegam como **string decimal** (ex.: `"8500.00"`) ou `null`, preservando a precisão de duas casas.

### Tabela geral de endpoints

| Método | Caminho | Auth | Quem acessa |
|---|---|---|---|
| `GET` | `/health` | público | qualquer um |
| `POST` | `/auth/register` | público | qualquer um |
| `POST` | `/auth/login` | público | qualquer um |
| `GET` | `/auth/verify` | público | qualquer um |
| `POST` | `/auth/resend-verification` | público | qualquer um |
| `GET` | `/api/v1/me` | JWT | usuário autenticado |
| `PATCH` | `/api/v1/me` | JWT | usuário autenticado |
| `PATCH` | `/api/v1/me/password` | JWT | usuário autenticado |
| `POST` | `/api/v1/orders` | JWT | cliente e admin |
| `GET` | `/api/v1/orders` | JWT | cliente (próprios) · admin (todos) |
| `GET` | `/api/v1/orders/{id}` | JWT | cliente (próprio) · admin |
| `PATCH` | `/api/v1/orders/{id}` | JWT | **apenas admin** |
| `GET` | `/api/v1/admin/dashboard` | JWT | **apenas admin** |

---

## Autenticação

Fluxo completo de uma conta nova:

1. `POST /auth/register` — cria a conta com `email_verified = false`.
2. Um e-mail de verificação é enviado (ou o link é impresso no log, em desenvolvimento sem SMTP).
3. `GET /auth/verify?token=...` — confirma o e-mail.
4. `POST /auth/login` — autentica e devolve o JWT. **O login só é permitido após a verificação do e-mail.**

---

## Endpoints — Auth

### `POST /auth/register`

Cria uma conta de cliente. O papel é sempre `CUSTOMER` — não há como criar um admin por aqui.

**Request body**

| Campo | Tipo | Regras |
|---|---|---|
| `name` | string | 1–255 caracteres |
| `email` | string | e-mail válido com TLD, único no sistema |
| `password` | string | 8–128 caracteres |

```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "minhasenha123"
}
```

**Resposta `201 Created`** — `UserRead`

```json
{
  "id": "8f3c…",
  "name": "João Silva",
  "email": "joao@example.com",
  "role": "CUSTOMER",
  "created_at": "2026-05-20T14:30:00Z"
}
```

| Status | Quando |
|---|---|
| `201` | Conta criada; e-mail de verificação disparado |
| `409` | E-mail já cadastrado |
| `422` | Corpo inválido (campo faltando, e-mail malformado, senha curta) |

---

### `POST /auth/login`

Autentica e devolve o token de acesso. **Rate limit: 10 requisições/minuto por IP.**

**Request body**

```json
{ "email": "joao@example.com", "password": "minhasenha123" }
```

**Resposta `200 OK`** — `TokenResponse`

```json
{ "access_token": "eyJhbGciOi…", "token_type": "bearer" }
```

| Status | Quando |
|---|---|
| `200` | Autenticado |
| `401` | Credenciais inválidas — mensagem genérica `"invalid credentials"`, idêntica para e-mail inexistente e senha errada |
| `403` | E-mail não verificado — `detail: "EMAIL_NOT_VERIFIED"` (a UI oferece reenvio) |
| `429` | *Rate limit* excedido |

---

### `GET /auth/verify`

Confirma o e-mail a partir do token recebido por e-mail. Sempre redireciona (HTTP 303) para o frontend.

| Query param | Descrição |
|---|---|
| `token` | JWT de verificação (validade de 24 h, `purpose: email_verify`) |

| Resultado | Redireciona para |
|---|---|
| Token válido | `{FRONTEND_ORIGIN}/login?verified=1` |
| Token inválido ou expirado | `{FRONTEND_ORIGIN}/login?verified=0` |

---

### `POST /auth/resend-verification`

Reenvia o e-mail de verificação. **Rate limit: 5 requisições/minuto por IP.**

**Request body**

```json
{ "email": "joao@example.com" }
```

**Resposta `200 OK`** — resposta **uniforme**, independentemente de o e-mail existir ou já estar verificado (evita enumeração de usuários):

```json
{ "detail": "Se o e-mail estiver cadastrado e pendente, enviamos um novo link." }
```

---

## Endpoints — Perfil

Prefixo `/api/v1/me`. Todos exigem JWT válido.

### `GET /api/v1/me`

Devolve os dados do usuário autenticado (`UserRead`).

### `PATCH /api/v1/me`

Atualiza o nome do usuário. O e-mail **não** é editável.

```json
{ "name": "João Silva Souza" }
```

Resposta `200 OK` — `UserRead`.

### `PATCH /api/v1/me/password`

Troca a senha. Exige a senha atual.

```json
{ "current_password": "minhasenha123", "new_password": "novasenhaforte456" }
```

| Status | Quando |
|---|---|
| `204` | Senha alterada (sem corpo de resposta) |
| `400` | Senha atual incorreta |
| `422` | Nova senha fora de 8–128 caracteres |

---

## Endpoints — Pedidos

Prefixo `/api/v1/orders`. Todos exigem JWT válido.

### `POST /api/v1/orders`

Cria um pedido. O pedido nasce em `AGUARDANDO_ANALISE` e já recebe a primeira entrada no histórico de status.

**Request body** — `OrderCreate`

| Campo | Tipo | Obrigatório | Regras |
|---|---|:---:|---|
| `whatsapp` | string | ✓ | Normalizado para dígitos; deve resultar em 10 ou 11 dígitos |
| `cep` | string | ✓ | Normalizado para o formato `NNNNN-NNN` (8 dígitos) |
| `city` | string | ✓ | 1–120 caracteres |
| `state` | string | ✓ | UF de 2 letras (convertida para maiúsculas) |
| `address_line` | string | — | Máx. 255 caracteres |
| `environments` | string | ✓ | 1–300 caracteres (ex.: `"Cozinha, Closet"`) |
| `furniture_types` | string | — | Máx. 500 caracteres |
| `observations` | string | — | Máx. 2000 caracteres |
| `client_name` | string | — | Máx. 255 — **considerado apenas em pedidos criados por admin** (*walk-in*) |
| `client_email` | string | — | E-mail válido — **considerado apenas em pedidos criados por admin** |

```json
{
  "whatsapp": "(12) 99786-1739",
  "cep": "12120-000",
  "city": "Tremembé",
  "state": "SP",
  "address_line": "Rua das Acácias, 120",
  "environments": "Cozinha, Closet",
  "furniture_types": "armário, bancada",
  "observations": "Cozinha em L, acabamento amadeirado."
}
```

**Resposta `201 Created`** — `OrderRead` (redigido conforme o papel de quem cria).

---

### `GET /api/v1/orders`

Lista pedidos paginados. **Cliente** vê apenas os próprios; **admin** vê todos.

| Query param | Padrão | Regras |
|---|---|---|
| `page` | `1` | ≥ 1 |
| `limit` | `20` | 1–100 |
| `status` | — | Filtra por status — **aplicado apenas para admin** |

**Resposta `200 OK`** — `PaginatedOrders` (lista de `OrderRead` no envelope de paginação).

```
GET /api/v1/orders?page=1&limit=20&status=APROVADO
```

---

### `GET /api/v1/orders/{id}`

Busca um pedido por UUID.

**Resposta `200 OK`** — `OrderRead`.

| Status | Quando |
|---|---|
| `200` | Pedido encontrado e acessível |
| `403` | Cliente tentando acessar pedido de outro usuário (proteção IDOR) |
| `404` | Pedido inexistente |

---

### `PATCH /api/v1/orders/{id}`

Atualiza um pedido. **Exclusivo de admin** — clientes recebem `403`.

É um *patch* parcial: apenas os campos presentes no corpo são alterados.

**Request body** — `OrderUpdateAdmin` (todos os campos opcionais)

| Campo | Tipo | Regras |
|---|---|---|
| `status` | enum | Novo status — sujeito à validação de transição |
| `project_value` | decimal | ≥ 0 |
| `estimated_cost` | decimal | ≥ 0 |
| `due_date` | date | Não pode ser uma data nova no passado |
| `install_date` | date | Não pode ser nova no passado, nem anterior a `due_date` |
| `admin_notes` | string | Máx. 2000 caracteres |
| `whatsapp` `city` `state` `address_line` `environments` `furniture_types` `observations` | — | Edição dos dados do cliente/projeto |
| `note` | string | Máx. 500 — nota anexada à entrada de histórico, quando há mudança de status |

**Resposta `200 OK`** — `OrderRead` (visão de admin).

| Status | Quando |
|---|---|
| `200` | Pedido atualizado |
| `400` | Campos obrigatórios ausentes para o status alvo, ou data inválida |
| `403` | Quem chama não é admin |
| `404` | Pedido inexistente |
| `409` | Transição de status inválida |

> Regras de transição e campos obrigatórios por status: **[regras-de-negocio.md](regras-de-negocio.md)**.

---

## Endpoints — Admin

### `GET /api/v1/admin/dashboard`

Métricas financeiras e operacionais. **Exclusivo de admin.**

| Query param | Padrão | Descrição |
|---|---|---|
| `year` | mês corrente | Ano de referência (2000–2100) |
| `month` | mês corrente | Mês de referência (1–12) |

**Resposta `200 OK`** — `DashboardSummary`

```jsonc
{
  "counts_by_status": {           // contagem de pedidos em cada estado
    "AGUARDANDO_ANALISE": 4,
    "EM_ORCAMENTO": 2,
    "APROVADO": 3,
    "EM_PRODUCAO": 5,
    "INSTALACAO_AGENDADA": 1,
    "CONCLUIDO": 12,
    "CANCELADO": 2
  },
  "revenue_month": "48500.00",    // soma de project_value dos concluídos no mês
  "cost_month": "31200.00",       // soma de estimated_cost dos mesmos pedidos
  "profit_month": "17300.00",     // revenue_month - cost_month
  "overdue_count": 3,             // pedidos ativos com due_date no passado
  "recent_orders": [ /* até 5 OrderRead, visão de admin */ ]
}
```

> Faturamento, custo e lucro consideram apenas pedidos que **atingiram `CONCLUIDO`** no mês selecionado — datado pela entrada correspondente no histórico de status.

---

## Endpoints — Health

### `GET /health`

*Health check* — não exige autenticação.

```json
{ "status": "ok" }
```

---

## Modelos de dados

### `OrderRead`

A resposta de leitura de pedido. Campos sensíveis são **redigidos para clientes** (devolvidos como `null`).

| Campo | Tipo | Visível ao cliente |
|---|---|:---:|
| `id` | UUID | ✓ |
| `order_number` | int | ✓ |
| `user_id` | UUID | ✓ |
| `customer_name` | string\|null | ✗ (apenas admin) |
| `customer_email` | string\|null | ✗ (apenas admin) |
| `status` | enum | ✓ |
| `whatsapp` `cep` `city` `state` `address_line` | string | ✓ |
| `environments` `furniture_types` `observations` | string\|null | ✓ |
| `project_value` | decimal\|null | ✓ — somente após sair de `AGUARDANDO_ANALISE` |
| `estimated_cost` | decimal\|null | ✗ (apenas admin) |
| `profit` | decimal\|null | ✗ (apenas admin) — calculado: `project_value − estimated_cost` |
| `admin_notes` | string\|null | ✗ (apenas admin) |
| `due_date` `install_date` | date\|null | ✓ |
| `created_at` `updated_at` | datetime | ✓ |
| `history` | lista de `OrderHistoryEntry` | ✓ |

### `OrderHistoryEntry`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Identificador da entrada |
| `from_status` | enum\|null | Status anterior (`null` na criação do pedido) |
| `to_status` | enum | Novo status |
| `note` | string\|null | Nota opcional da transição |
| `created_at` | datetime | Momento exato da transição |

### `OrderStatus` (enum)

`AGUARDANDO_ANALISE` · `EM_ORCAMENTO` · `APROVADO` · `EM_PRODUCAO` · `INSTALACAO_AGENDADA` · `CONCLUIDO` · `CANCELADO`

### `UserRead`

| Campo | Tipo |
|---|---|
| `id` | UUID |
| `name` | string |
| `email` | string |
| `role` | enum — `CUSTOMER` \| `ADMIN` |
| `created_at` | datetime |

---

## Códigos de status

| Código | Significado no contexto desta API |
|---|---|
| `200 OK` | Requisição bem-sucedida com corpo de resposta |
| `201 Created` | Recurso criado (registro, pedido) |
| `204 No Content` | Sucesso sem corpo (troca de senha) |
| `303 See Other` | Redirecionamento (verificação de e-mail) |
| `400 Bad Request` | Violação de regra de negócio (data inválida, campo obrigatório ausente) |
| `401 Unauthorized` | Token ausente/inválido, ou credenciais de login incorretas |
| `403 Forbidden` | Sem permissão (não-admin em rota de admin, IDOR, e-mail não verificado) |
| `404 Not Found` | Recurso inexistente |
| `409 Conflict` | E-mail já cadastrado, ou transição de status inválida |
| `422 Unprocessable Entity` | Falha de validação do schema (Pydantic) |
| `429 Too Many Requests` | *Rate limit* excedido |

---

## Tratamento de erros

Toda resposta de erro segue a forma padrão do FastAPI:

```json
{ "detail": "mensagem legível" }
```

As mensagens internas/de desenvolvimento são em inglês. O **frontend** normaliza os erros de validação (`422`), que chegam como uma lista, para uma única mensagem em português:

```json
{ "detail": "Dados inválidos. Verifique os campos preenchidos." }
```

**Exemplos de respostas de erro**

```jsonc
// 401 — credenciais erradas (mensagem genérica, sem revelar a causa)
{ "detail": "invalid credentials" }

// 409 — transição de status inválida
{ "detail": "Invalid status transition" }

// 400 — campo obrigatório ausente para o status alvo
{ "detail": "Missing required fields for APROVADO: project_value, due_date" }

// 403 — cliente acessando pedido de outro usuário
{ "detail": "Not your order" }
```
