# Product Requirements Document — Marcenaria Order Management System

| | |
|---|---|
| **Product** | Marcenaria Order Management System |
| **Repo** | `ramos-planejados` (monorepo: `src/` backend · `frontend/` Next.js) |
| **Version** | 2.0 |
| **Status** | Active |
| **Owner** | Gabriel |
| **Last updated** | 2026-05-20 |

> **v2.0 — order-management expansion.** The product moved past the original
> capture-and-track MVP. Orders now carry contact/address, multiple
> environments, furniture-type tags, financial fields and scheduling dates;
> the lifecycle has 7 states with an automatic status-change history; the
> admin has a metrics dashboard. Sections below marked *(v2.0)* reflect the
> current system; where v1.2 prose conflicts, v2.0 wins.

> **Note on language:** This document and all source artifacts (code, commits, PLAN.md, identifiers) are written in English. The end-user product text — anything a Brazilian customer of the marcenaria sees in the UI — is written in Portuguese.

---

## 1. Vision

A focused web platform that lets a custom-furniture workshop (*marcenaria*) capture quote requests online, track every order through a clear lifecycle, and give customers self-service visibility into the status of their order.

The product lives in a single monorepo (`ramos-planejados`):
- **`src/`** — REST API (FastAPI + PostgreSQL). Backend complete.
- **`frontend/`** — Web interface (Next.js + TypeScript + Tailwind CSS + shadcn/ui). In development.

## 2. Problem

Small marcenarias today coordinate orders through WhatsApp threads, e-mail, and spreadsheets. Three concrete pains follow from that:

- **Lost requests.** Quote inquiries arrive on different channels and slip through.
- **Opaque status.** Customers have no way to check progress without messaging the shop owner.
- **No workload view.** The owner cannot see at a glance which orders are pending, in production, or done.

## 3. Goals

- **G-1.** Capture new leads via an online quote-request form behind authentication.
- **G-2.** Centralize every order in one system with an explicit lifecycle state.
- **G-3.** Let customers self-serve order tracking.
- **G-4.** Give the shop a single list/filter view of all orders.
- **G-5.** Present the business with a public institutional landing page.

## 4. Non-Goals (out of scope) *(v2.0)*

- Image / file uploads (reference photos)
- Notifications (e-mail, WhatsApp, SMS)
- Visit-scheduling calendar / Kanban production board
- PDF quote export
- Multi-employee role hierarchy beyond `ADMIN` / `CUSTOMER`
- Native mobile applications
- Soft-delete and order deletion of any kind

> Now **in scope** (v2.0, was a v1.2 non-goal): admin-only financial control
> (project value / estimated cost / computed profit), per-order status
> history, and the admin metrics dashboard.

## 5. Personas

| Persona | Description | Primary needs |
|---|---|---|
| **Customer** (*Cliente*) | End buyer commissioning a custom piece of furniture. | Submit a request, see its current status, log in securely. |
| **Admin** (*Marceneiro / dono*) | Workshop owner or operator. | See every order, filter by status, advance an order through its lifecycle. |
| **Visitor** | Anonymous user landing on the public website. | Learn about the shop, be directed to register and request a quote. |

## 6. User Stories

**Customer**
- **US-1** — As a customer, I can register and log in so I can submit and track orders.
- **US-2** — As a customer, I can submit a quote request that captures the furniture I want.
- **US-3** — As a customer, I can list my own orders and see each one's current status.

**Admin**
- **US-4** — As an admin, I can list every order in the system.
- **US-5** — As an admin, I can filter orders by status.
- **US-6** — As an admin, I can advance an order's status as work progresses.

**Visitor**
- **US-7** — As a visitor, I can browse the public landing page and be directed to register.

## 7. Functional Requirements

### 7.1 Authentication
- **FR-1.** Users register with name, e-mail, and password.
- **FR-2.** Login returns a signed JWT access token with a 24 h expiry. Refresh tokens are out of scope.
- **FR-3.** Every protected endpoint requires a valid JWT.
- **FR-4.** Passwords are stored as bcrypt hashes — never in plaintext.
- **FR-5.** E-mail is unique per account.

### 7.2 Orders *(v2.0)*
- **FR-6.** An authenticated customer can create an order with: `whatsapp`,
  `cep`, `city`, `state`, optional `address_line`, one or more `environments`,
  free-form `furniture_types` tags, and optional `observations`.
- **FR-7.** Every order carries a `status` from the 7-state enum
  `{ AGUARDANDO_ANALISE, EM_ORCAMENTO, APROVADO, EM_PRODUCAO,
  INSTALACAO_AGENDADA, CONCLUIDO, CANCELADO }`. Admins may also set
  `project_value`, `estimated_cost`, `due_date`, `install_date`, `admin_notes`.
- **FR-8.** Newly created orders default to `AGUARDANDO_ANALISE`. Every status
  change appends a row to the order's status history.
- **FR-9.** A customer can list and read only their own orders.
- **FR-10.** An admin can list every order, with pagination (`page`, `limit`) and future status filter.
- **FR-11.** Only an admin can update an order's status; customers cannot.
- **FR-12.** Each order tracks `created_at` and `updated_at`.

### 7.3 Web Interface
- **FR-13.** Public landing page with shop presentation and call-to-action to register.
- **FR-14.** Customer portal: authenticated pages to create orders and view their status.
- **FR-15.** Admin panel: paginated order table with status filter and inline status advance.

### 7.4 Documentation
- **FR-16.** The API exposes auto-generated OpenAPI/Swagger documentation at `/docs`.

### 7.5 Administration
- **FR-17.** The first `ADMIN` user is created by a seed script that reads credentials from environment variables. No endpoint grants or revokes the `ADMIN` role.

## 8. Non-Functional Requirements

- **NFR-1. Stack.** Backend: Python 3.11+, FastAPI, PostgreSQL, SQLAlchemy, Pydantic, python-jose, passlib[bcrypt]. Frontend: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui.
- **NFR-2. Containerization.** `docker-compose` brings up `api` + `db` for local development.
- **NFR-3. Deploy.** Backend (`src/`): AWS — RDS + ECS/Fargate or Elastic Beanstalk. Frontend (`frontend/`): Vercel.
- **NFR-4. HTTPS** in any deployed environment.
- **NFR-5. 12-factor configuration.** All secrets and environment-specific values come from environment variables.
- **NFR-6. Migrations.** Schema is managed with Alembic.
- **NFR-7. Tests.** Unit + integration + security tests; ≥ 70% line coverage on `src/`. Current: 91%.
- **NFR-8. Logging.** Structured JSON logs in production.
- **NFR-9. Errors.** Consistent error response shape (`{ "detail": "..." }`) across the API.
- **NFR-10. Brute-force protection.** `/auth/login` rate-limited at 10 req/min per IP (slowapi).
- **NFR-11. CORS.** API allows browser requests only from the configured `FRONTEND_ORIGIN`.

## 9. Business Rules

- **BR-1.** Every order starts in `PENDING`.
- **BR-2.** Only an admin may change an order's status.
- **BR-3.** A customer may read only their own orders.
- **BR-4.** Authentication is required for every order operation.
- **BR-5.** Admin privilege is identified by a `role` field on the user record.
- **BR-6.** E-mail is unique per user account.
- **BR-7.** Orders are immutable except for `status` and `updated_at`.
- **BR-8.** Status transitions are forward-only along `PENDING → IN_PROGRESS → DONE`. HTTP 409 on invalid transitions.
- **BR-9.** The `ADMIN` role can only be granted out-of-band (seed script). Self-service registration always produces a `CUSTOMER`.

## 10. Conceptual Data Model

**users**
- `id` *(UUID, PK)*
- `name`
- `email` *(unique)*
- `password_hash`
- `role` *(enum: `CUSTOMER`, `ADMIN`)*
- `created_at`, `updated_at`

**orders**
- `id` *(UUID, PK)*
- `user_id` *(FK → users.id)*
- `furniture_type` *(max 100 chars)*
- `description` *(free text)*
- `measurements` *(free-text, e.g., "2,00m × 0,60m × 1,80m")*
- `contact` *(phone or alternate channel)*
- `status` *(enum: `PENDING`, `IN_PROGRESS`, `DONE`)*
- `created_at`, `updated_at`

> Formal ERD with column types, indexes, and constraints: see `PLAN.md`.

## 11. High-Level Architecture

```
[ Browser ]
     │  HTTPS
     ▼
[ frontend/ — Next.js ]   ← landing page + customer portal + admin panel
     │  HTTPS / JSON (CORS)
     ▼
[ src/ — FastAPI ]        ← auth, business rules, persistence
     │
     ▼
[ PostgreSQL (RDS) ]
```

- Monorepo: `src/` (backend) + `frontend/` (Next.js) in the same repository.
- Backend deployed to AWS; frontend deployed to Vercel (independently).
- JWT authentication; bcrypt password hashing.
- Local development: `docker-compose` (api + db) + `npm run dev` (frontend).

## 12. API Surface

> Full contracts at `/docs` (Swagger). This is a planning-level summary.

| Method | Path | Auth | Role |
|---|---|---|---|
| `POST` | `/auth/register` | public | — |
| `POST` | `/auth/login` | public | — |
| `POST` | `/api/v1/orders` | JWT | customer |
| `GET` | `/api/v1/orders?page=1&limit=20` | JWT | customer (own) / admin (all) |
| `GET` | `/api/v1/orders/{id}` | JWT | customer (own) / admin |
| `PATCH` | `/api/v1/orders/{id}/status` | JWT | admin only |
| `GET` | `/health` | public | — |

## 13. Success Metrics

- **M-1.** A first-time customer can sign up, submit, and track an order via the web interface with zero external help.
- **M-2.** Health endpoint reachable in the deployed environment.
- **M-3.** CI runs the test suite on every push and stays green (current coverage: 91%).
- **M-4.** `POST /api/v1/orders` round-trip latency under 500 ms p50 from same AWS region.

## 14. Risks & Open Questions

> All previous open questions resolved:
> - Admin elevation → FR-17 / BR-9
> - Q-2 Frontend stack → **resolved**: Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui in `marcenaria-web`

- **Q-1.** Cloud target. *(Default plan: AWS RDS + ECS/Fargate for the API; Vercel for the frontend.)*

## 15. Post-MVP Roadmap (themes, not commitments)

**Actively in development:**
- Web interface (`marcenaria-web`) — institutional landing page, customer portal, admin panel

**Planned next:**
- Notifications on creation and status change (e-mail, WhatsApp)
- Per-order status-change history (timeline / audit trail)
- Admin dashboard with metrics (open / finished, average lead time)
- Image attachments on orders (reference photos)

**Future themes:**
- Visit scheduling with availability windows
- Financial control (price per order, payment status, basic reports)
- Expanded roles (`ADMIN` / `EMPLOYEE` / `CUSTOMER`)
- Refresh-token flow and token revocation
- Multi-team / multi-shop support

## 16. Glossary

- **Marcenaria** — a custom woodworking / cabinet-making shop.
- **Order** — a customer's request for a custom furniture piece, regardless of stage.
- **Status** — discrete lifecycle state of an order: `PENDING`, `IN_PROGRESS`, `DONE`.
