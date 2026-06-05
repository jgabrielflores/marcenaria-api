# PLAN.md — ramos-planejados Technical Implementation Plan

| | |
|---|---|
| **Based on** | PRD v1.1 |
| **Version** | 1.0 |
| **Last updated** | 2026-05-11 |

> This document translates the PRD into concrete technical decisions.
> When PRD and PLAN.md conflict, raise the issue — do not silently resolve it.

---

## 1. Entity-Relationship Diagram

### 1.1 Table: `users`

| Column | Type | Constraints |
|---|---|---|
| `id` | `UUID` | PK, default `gen_random_uuid()` |
| `name` | `VARCHAR(255)` | NOT NULL |
| `email` | `VARCHAR(255)` | NOT NULL, UNIQUE |
| `password_hash` | `VARCHAR(255)` | NOT NULL |
| `role` | `ENUM('CUSTOMER','ADMIN')` | NOT NULL, DEFAULT `'CUSTOMER'` |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `now()` |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `now()` |

**Indexes:**
- `PK` on `id`
- `UNIQUE` on `email`

---

### 1.2 Table: `orders`

| Column | Type | Constraints |
|---|---|---|
| `id` | `UUID` | PK, default `gen_random_uuid()` |
| `user_id` | `UUID` | NOT NULL, FK → `users.id` ON DELETE RESTRICT |
| `furniture_type` | `VARCHAR(100)` | NOT NULL |
| `description` | `TEXT` | NOT NULL |
| `measurements` | `TEXT` | NOT NULL |
| `contact` | `VARCHAR(255)` | NOT NULL |
| `status` | `ENUM('PENDING','IN_PROGRESS','DONE')` | NOT NULL, DEFAULT `'PENDING'` |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `now()` |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `now()` |

**Indexes:**
- `PK` on `id`
- `INDEX` on `user_id` (FK lookup)
- `INDEX` on `status` (admin filter)
- `COMPOSITE INDEX` on `(user_id, status)` (customer filtered list)

**FK note:** `ON DELETE RESTRICT` means a user with orders cannot be deleted.
Consistent with BR-7 (orders are append-only, no deletion in MVP).

---

### 1.3 Relationship

```
users 1 ──────────< orders (many)
      user_id (FK)
```

One user may have many orders. Each order belongs to exactly one user.

---

## 2. Folder Structure

```
ramos-planejados/
│
├── src/
│   ├── main.py               # FastAPI app factory; mounts routers
│   ├── config.py             # pydantic-settings BaseSettings; reads from .env
│   ├── database.py           # SQLAlchemy engine, SessionLocal, get_db()
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py           # User model + Role enum
│   │   └── order.py          # Order model + OrderStatus enum
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── auth.py           # RegisterRequest, LoginRequest, TokenResponse, UserRead
│   │   └── order.py          # OrderCreate, OrderRead, OrderStatusUpdate
│   │
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py           # POST /auth/register, POST /auth/login
│   │   └── orders.py         # CRUD under /api/v1/orders
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth.py           # register_user(), authenticate_user(), create_access_token()
│   │   └── order.py          # create_order(), list_orders(), get_order(), update_order_status()
│   │
│   ├── dependencies.py       # get_current_user(), require_admin()
│   │
│   └── scripts/
│       └── seed_admin.py     # Creates first ADMIN user from env vars
│
├── migrations/               # Alembic auto-generated migration scripts
│   ├── env.py
│   └── versions/
│
├── tests/
│   ├── conftest.py           # Test DB setup, fixtures (test client, test user, test admin)
│   ├── unit/                 # Pure logic — no DB, no HTTP (@pytest.mark.unit)
│   │   ├── test_auth_service.py
│   │   └── test_order_service.py
│   ├── integration/          # Real test DB + HTTP via TestClient (@pytest.mark.integration)
│   │   ├── test_auth_routes.py
│   │   └── test_order_routes.py
│   └── security/             # Adversarial scenarios — attack simulations (@pytest.mark.security)
│       ├── test_authentication.py        # JWT missing/expired/tampered/alg:none
│       ├── test_authorization.py         # IDOR, customer→admin endpoint, unauthenticated
│       ├── test_input_validation.py      # SQL injection, oversized inputs, bad UUIDs
│       ├── test_rate_limiting.py         # /auth/login: 11th request → 429
│       └── test_information_disclosure.py # Uniform login error, password_hash never exposed
│
├── .github/
│   └── workflows/
│       └── ci.yml            # Runs all tests on every push and PR (GitHub Actions)
│
├── .env.example              # Variable names without values — committed to repo
├── .env                      # Actual secrets — NEVER committed
├── .gitignore
├── alembic.ini
├── docker-compose.yml
├── Dockerfile
├── pyproject.toml            # Project metadata + dependencies + pytest config
└── requirements.txt          # Pinned deps for Docker (generated from pyproject.toml)
```

**Layer responsibilities (never cross these lines):**

| Layer | Does | Does NOT |
|---|---|---|
| `routers/` | Parse HTTP, validate input, call service, return response | Business logic, DB access |
| `services/` | Business rules, orchestrate DB calls | Import from `routers/` |
| `models/` | Define DB schema | Contain business logic |
| `schemas/` | Define request/response shapes | Reference DB models directly |
| `dependencies.py` | FastAPI `Depends` — resolve current user | Business logic |

---

## 3. Endpoint Contracts

### 3.1 POST `/auth/register`

**Auth:** public

**Request body:**
```json
{ "name": "string", "email": "user@example.com", "password": "string (min 8 chars)" }
```

**Response 201:**
```json
{ "id": "uuid", "name": "string", "email": "string", "role": "CUSTOMER", "created_at": "datetime" }
```

**Errors:**
| Status | When |
|---|---|
| 409 | E-mail already registered |
| 422 | Validation failure (missing field, invalid email format, password too short) |

---

### 3.2 POST `/auth/login`

**Auth:** public

**Request body:**
```json
{ "email": "user@example.com", "password": "string" }
```

**Response 200:**
```json
{ "access_token": "string (JWT)", "token_type": "bearer" }
```

**Errors:**
| Status | When |
|---|---|
| 401 | Wrong email **or** wrong password — always return `"detail": "invalid credentials"` (never reveal which) |
| 422 | Validation failure |

---

### 3.3 POST `/api/v1/orders`

**Auth:** Bearer JWT (any authenticated user)

**Request body:**
```json
{
  "furniture_type": "string (max 100 chars)",
  "description": "string",
  "measurements": "string (free text, e.g. '2,00m x 0,60m')",
  "contact": "string"
}
```

**Response 201:** full `OrderRead` (see §3.6)

**Errors:**
| Status | When |
|---|---|
| 401 | Missing or invalid JWT |
| 422 | Validation failure |

---

### 3.4 GET `/api/v1/orders`

**Auth:** Bearer JWT

**Query params:**
| Param | Type | Who can use | Notes |
|---|---|---|---|
| `status` | `PENDING \| IN_PROGRESS \| DONE` | Admin only | Ignored for customers |

**Response 200:** `[ OrderRead ]`

**Behavior:**
- Customer → returns only their own orders (ignores `status` filter).
- Admin → returns all orders; optionally filtered by `status`.

**Errors:**
| Status | When |
|---|---|
| 401 | Missing or invalid JWT |

---

### 3.5 GET `/api/v1/orders/{id}`

**Auth:** Bearer JWT

**Response 200:** `OrderRead`

**Errors:**
| Status | When |
|---|---|
| 401 | Missing or invalid JWT |
| 403 | Customer trying to read another user's order |
| 404 | Order does not exist |

---

### 3.6 PATCH `/api/v1/orders/{id}/status`

**Auth:** Bearer JWT — **admin only**

**Request body:**
```json
{ "status": "IN_PROGRESS | DONE" }
```

> `PENDING` is the initial state and is never a valid target for an update.

**Response 200:** `OrderRead`

**Errors:**
| Status | When |
|---|---|
| 401 | Missing or invalid JWT |
| 403 | Caller is not an admin |
| 404 | Order does not exist |
| 409 | Transition violates BR-8 (e.g. DONE → IN_PROGRESS, or PENDING → DONE) |

---

### 3.7 GET `/health`

**Auth:** public

**Response 200:**
```json
{ "status": "ok" }
```

---

### 3.8 OrderRead schema (shared response shape)

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "furniture_type": "string",
  "description": "string",
  "measurements": "string",
  "contact": "string",
  "status": "PENDING | IN_PROGRESS | DONE",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

---

## 4. Status Transition Map (BR-8)

```
PENDING  ──►  IN_PROGRESS  ──►  DONE
```

Valid transitions (the only ones the API accepts):

| From | To | Accepted |
|---|---|---|
| PENDING | IN_PROGRESS | ✅ |
| IN_PROGRESS | DONE | ✅ |
| PENDING | DONE | ❌ 409 |
| IN_PROGRESS | PENDING | ❌ 409 |
| DONE | anything | ❌ 409 |

---

## 5. Dependencies

```toml
# pyproject.toml [project.dependencies]
fastapi>=0.111
uvicorn[standard]>=0.29
sqlalchemy>=2.0
alembic>=1.13
pydantic>=2.7
pydantic-settings>=2.2
python-jose[cryptography]>=3.3
passlib[bcrypt]>=1.7
psycopg2-binary>=2.9
slowapi>=0.1.9

[project.optional-dependencies]
dev = [
  "pytest>=8.2",
  "pytest-cov>=5.0",
  "httpx>=0.27",
]
```

**Why each dependency:**
| Package | Purpose |
|---|---|
| `fastapi` | Web framework |
| `uvicorn` | ASGI server that runs FastAPI |
| `sqlalchemy` | ORM — maps Python classes to DB tables |
| `alembic` | Manages DB schema changes (migrations) |
| `pydantic` + `pydantic-settings` | Data validation + reading env vars |
| `python-jose` | Sign and verify JWT tokens |
| `passlib[bcrypt]` | Hash and verify passwords |
| `psycopg2-binary` | PostgreSQL driver |
| `slowapi` | Rate limiting for FastAPI (wraps `limits`) |
| `httpx` | HTTP client used by FastAPI's `TestClient` in tests |

---

## 6. Phased Implementation Order

Work through phases in order. Each phase produces something testable before the next begins.

**Testing principle:** unit tests are written in the same phase as the code they cover — not deferred. Only integration tests (which require a running database) and security tests are grouped in Phase 6, because they depend on the full stack being in place.

### Phase 1 — Project skeleton
- [x] `pyproject.toml` with all dependencies
- [x] `Dockerfile` (Python 3.11-slim, installs deps, runs uvicorn)
- [x] `docker-compose.yml` (services: `api`, `db`)
- [x] `.env.example` + `.gitignore`
- [x] `git init` + first commit
- [x] `src/main.py` — bare FastAPI app with `/health`
- [x] `src/config.py` — `Settings` class reading from env
- [x] `src/database.py` — engine + `get_db()` dependency
- [x] `alembic.ini` + `migrations/env.py` wired to `DATABASE_URL`

**Checkpoint:** `docker-compose up` → `GET /health` returns `{"status": "ok"}`.

---

### Phase 2 — Models and first migration
- [x] `src/models/user.py` — `User` model + `Role` enum
- [x] `src/models/order.py` — `Order` model + `OrderStatus` enum
- [x] `alembic revision --autogenerate -m "create users and orders tables"`
- [x] Review generated migration, verify indexes and FK
- [x] `alembic upgrade head`

**Checkpoint:** tables exist in DB; migration rolls back cleanly with `alembic downgrade -1`.

---

### Phase 3 — Authentication
- [x] `src/schemas/auth.py` — `RegisterRequest`, `LoginRequest`, `TokenResponse`, `UserRead`
- [x] `src/services/auth.py` — `register_user()`, `authenticate_user()`, `create_access_token()`
- [x] `tests/unit/test_auth_service.py` — written alongside `services/auth.py`:
  - `test_register_user_returns_user_read`
  - `test_register_user_with_duplicate_email_raises_409`
  - `test_authenticate_user_with_wrong_password_raises_401`
  - `test_authenticate_user_with_unknown_email_raises_401`
  - `test_create_access_token_contains_expected_claims`
- [x] `src/dependencies.py` — `get_current_user()`, `require_admin()`
- [x] `src/routers/auth.py` — `POST /auth/register`, `POST /auth/login`
- [x] Mount router in `src/main.py`
- [x] Apply `slowapi` rate limit to `POST /auth/login`

**Checkpoint:** register + login flow works end-to-end via `/docs`; `pytest -m unit` exits green.

---

### Phase 4 — Orders
- [x] `src/schemas/order.py` — `OrderCreate`, `OrderRead`, `OrderStatusUpdate`
- [x] `src/services/order.py` — `create_order()`, `list_orders()`, `get_order()`, `update_order_status()`
- [x] `tests/unit/test_order_service.py` — written alongside `services/order.py`:
  - `test_create_order_defaults_to_pending`
  - `test_list_orders_customer_sees_only_own_orders`
  - `test_get_order_customer_cannot_read_another_users_order`
  - `test_update_order_status_pending_to_in_progress_succeeds`
  - `test_update_order_status_pending_to_done_raises_409`
  - `test_update_order_status_done_to_any_raises_409`
  - `test_update_order_status_non_admin_raises_403`
- [x] `src/routers/orders.py` — all 4 order endpoints
- [x] Mount router in `src/main.py`

**Checkpoint:** full order lifecycle testable via `/docs` with a customer token and an admin token; `pytest -m unit` exits green.

---

### Phase 5 — Hardening
- [x] `src/scripts/seed_admin.py` — idempotent admin seed
- [x] Structured JSON logging (production) vs. plain text (development)
- [x] Verify all error responses match `{ "detail": "..." }` shape
- [x] Verify uniform 401 response for wrong email vs. wrong password

**Checkpoint:** seed script creates admin; logs are JSON in production mode.

---

### Phase 6 — Integration & Security Tests
Unit tests were already written in Phases 3 and 4. This phase adds the tests that require a full running stack (database + HTTP layer) and adversarial scenarios.

- [x] `tests/conftest.py` — test DB (dedicated Postgres container), fixtures: `client`, `customer_token`, `admin_token`
- [x] `tests/integration/test_auth_routes.py` — HTTP-level register + login
- [x] `tests/integration/test_order_routes.py` — HTTP-level order CRUD + status update + 403/404/409 cases
- [x] `tests/security/test_authentication.py` — JWT missing, expired, tampered, `alg:none` attack
- [x] `tests/security/test_authorization.py` — IDOR check, customer→admin endpoint, unauthenticated access
- [x] `tests/security/test_input_validation.py` — SQL injection payloads, oversized inputs, bad UUIDs
- [x] `tests/security/test_rate_limiting.py` — 11th login attempt returns 429
- [x] `tests/security/test_information_disclosure.py` — uniform login error, `password_hash` never in any response
- [x] `pytest` (no args) must exit green with coverage ≥ 90%
- [x] `pytest -m security -v` must exit green independently

**Checkpoint:** `pytest` exits green; coverage ≥ 90%; `pytest -m security` all pass.

---

### Phase 7 — CI Pipeline
*(Source: GitHub Actions official docs — docs.github.com/actions)*

- [x] `.github/workflows/ci.yml` — triggers on every `push` and `pull_request` to `main`/`develop`
  - Spins up a Postgres 16 service container (same version as production)
  - Installs deps via `pip install -e ".[dev]"`
  - Runs `alembic upgrade head` against the test DB
  - Runs `pytest` — fails if coverage < 90% or any test fails
- [x] Add coverage badge to `README.md` (generated by `pytest-cov` + shields.io or codecov)

> Expanded in the deploy plan (Fase 4): the pipeline now also runs `ruff` + `mypy`
> (backend) and `eslint` + `tsc` + `prettier` + `vitest` + `next build` (frontend),
> and both jobs are required checks on the protected `main`/`develop` branches.

**Why this matters for your portfolio:** every push to GitHub will show a green ✅ or red ❌ in the Actions tab. Hiring managers see this immediately. It signals that you work the way professional teams work.

**Checkpoint:** push a commit → GitHub Actions tab shows green; coverage badge appears on README.

---

### Phase 8 — Deploy (Railway)

> Deploy runs entirely on Railway: a Docker `BackEnd` service, a Nixpacks `FrontEnd`
> service, and a managed `Postgres`, all in the same project. Migrations and the admin
> seed run on boot via `entrypoint.sh`. Detailed plan: `~/.claude/plans/kind-jumping-pebble.md`.

- [x] Finalize `.env.example` and `railway.json` for the backend Docker service
- [x] Provision managed PostgreSQL on Railway (`DATABASE_URL` via reference)
- [x] Deploy the backend container; run migrations + admin seed on boot (`entrypoint.sh`)
- [x] Deploy the frontend (Nixpacks) with `NEXT_PUBLIC_API_URL` pointing at the backend
- [x] Verify `GET /health` is reachable over HTTPS; admin can log in
- [x] Set `FRONTEND_ORIGIN` on the backend to the frontend's Railway URL (CORS)
- [ ] Split staging (`develop`) and production (`main`) into isolated environments
- [ ] Validate M-4: `POST /api/v1/orders` p50 < 500 ms within the Railway region

**Checkpoint:** `GET /health` returns `{"status":"ok"}` over HTTPS; seed admin can log in.

---

### Phase 9 — Frontend (frontend/ — this repo)

> Frontend lives in `frontend/` inside this monorepo.

#### Phase 9-A — Backend adjustments ✅ Done
- [x] `CORSMiddleware` with `FRONTEND_ORIGIN` env var (GET/POST/PATCH only)
- [x] Paginate `GET /api/v1/orders` — returns `{items, total, page, limit, pages}`
- [x] Update all affected tests and CI green

#### Phase 9-B — Next.js setup (inside frontend/)
- [x] `npx create-next-app@latest frontend --typescript --tailwind --app` (Next.js 16)
- [x] Install shadcn/ui: `npx shadcn@latest init`
- [x] Configure `lib/api.ts` (fetch wrapper with base URL + Authorization header)
- [x] Configure `proxy.ts` (Next.js 16 route guard — protects `/conta` and `/admin`)

#### Phase 9-C — Authentication pages
- [ ] `/login` — calls `POST /auth/login`, stores JWT in secure cookie
- [ ] `/register` — calls `POST /auth/register`
- [ ] Logout (clears token)
- [ ] Middleware redirects unauthenticated users to `/login`

#### Phase 9-D — Customer portal
- [ ] `/orders` — paginated list with status badge (PENDING / IN_PROGRESS / DONE)
- [ ] `/orders/new` — order creation form
- [ ] `/orders/[id]` — order detail with status stepper

#### Phase 9-E — Admin panel
- [x] `/admin/orders` — full order table, status filter, pagination, inline status advance
- [x] Summary cards: total by status

#### Phase 9-F — Landing page
- [ ] Public `/` — shop presentation, gallery, CTA to register
- [ ] Header / footer shared layout
- [ ] SEO metadata (Next.js Metadata API)

**Checkpoint (full):** visitor browses `/` → registers → creates order → sees status badge; admin logs in → sees all orders → advances status → Railway deploy live.

---

### Phase 10–13 — Order-management expansion ✅ Done

Expansion beyond the original MVP — see the plan file
`preciso-que-voc-atualize-iterative-sifakis.md` for the full design.

- **Phase 10 (backend):** `orders` recreated with the production schema
  (WhatsApp, CEP/address, multi-environment, furniture tags, financial fields,
  scheduling dates); 7-state `OrderStatus`; `order_status_history` timeline;
  sequential `order_number`; endpoints `PATCH /orders/{id}`,
  `GET /admin/dashboard`, `GET/PATCH /me`, `PATCH /me/password`; migration
  `0002`. Admin order view also exposes `customer_name` / `customer_email`.
- **Phase 12–13 (frontend):** customer area `/conta` (list, new-order form with
  ViaCEP autofill, detail + timeline, profile) and admin panel `/admin`
  (KPI dashboard, order table, editable management detail). Legacy `/orders`
  routes redirect to `/conta/pedidos`.

Decisions taken: UUID PK + sequential `order_number`; fresh-start migration
(no data preservation); admin edits financials with `project_value` shown to
customers from `EM_ORCAMENTO` onward; image uploads dropped from scope.

---

## 7. Open decisions

> All major decisions resolved. No blocking open questions.

| # | Question | Resolution |
|---|---|---|
| D-1 | SQLAlchemy or SQLModel? | SQLAlchemy 2.0 ORM |
| D-2 | Test DB: SQLite or Postgres container? | Dedicated Postgres container (matches production) |
| D-3 | Logging library? | `python-json-logger` |
| D-4 | Frontend stack? | Next.js 16 + TypeScript + Tailwind + shadcn/ui |
| D-5 | Deploy target? | Railway (backend + frontend + managed PostgreSQL) |
