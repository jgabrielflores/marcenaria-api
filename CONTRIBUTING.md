# Contribuindo

Obrigado pelo interesse em contribuir com o **Ramos Planejados** (`marcenaria-api`). Este guia
resume o fluxo de trabalho, os padrões e os portões de qualidade do projeto. Para o passo a passo
completo, veja os documentos enlaçados ao longo do texto.

## Pré-requisitos e ambiente local

Siga o [guia de desenvolvimento](docs/desenvolvimento.md) para subir o backend (Docker Compose +
migrações + seed) e o frontend (Node 22 + `npm`). O `.env.example` e o
`frontend/.env.local.example` listam as variáveis necessárias.

## Modelo de branches (Git Flow)

| Branch | Papel | Ambiente |
| --- | --- | --- |
| `main` | Produção | deploy de produção no Railway |
| `develop` | Staging / integração | deploy de staging no Railway |
| `feature/*` | Trabalho em andamento | - |

`main` e `develop` são **protegidas**: não há push direto, nem para o dono. Toda mudança entra
por Pull Request. O fluxo detalhado (com diagrama) está em
[docs/fluxo-de-trabalho.md](docs/fluxo-de-trabalho.md).

## Passo a passo de uma contribuição

1. `git checkout develop && git pull`
2. `git checkout -b feature/<nome-curto>`
3. Implemente a mudança (código ou documentação).
4. Rode os portões de qualidade localmente (abaixo) - todos verdes.
5. `git push -u origin feature/<nome-curto>`
6. Abra o PR contra `develop`: `gh pr create --base develop`
7. Aguarde o CI verde (os jobs **Backend** e **Frontend** são obrigatórios) e faça o merge.
8. Promova para produção quando `develop` estiver estável: PR `develop` -> `main`.

## Portões de qualidade

São os mesmos checks que o CI exige. Rode antes de abrir o PR.

**Backend**

```bash
ruff check src tests
ruff format --check src tests
mypy src
pytest --cov-fail-under=90
```

> No Windows, rode a suíte completa dentro do container (o psycopg2 host -> container gera
> `UnicodeDecodeError`):
> `docker compose run --rm -u root api sh -c "pip install -e '.[dev]' && alembic upgrade head && pytest"`.

**Frontend** (a partir de `frontend/`)

```bash
npm run lint
npm run type-check
npm run format:check
npm test
npm run build
```

## Estilo de código

- **Idioma:** código, identificadores, comentários, mensagens de commit e descrições de PR em
  **inglês**; textos de interface e mensagens de erro ao usuário final em **português (Brasil)**.
- **Backend:** arquitetura em camadas (Router -> Service -> ORM); veja
  [docs/arquitetura.md](docs/arquitetura.md) e [docs/seguranca.md](docs/seguranca.md).
- **Frontend:** Next.js 16 (App Router) com TypeScript estrito; a arquitetura do frontend está
  descrita em [docs/arquitetura.md](docs/arquitetura.md).
- Sem soluções temporárias sem sinalizar a dívida técnica; sem código duplicado; sem código morto
  comentado.

## Mensagens de commit

Use o modo imperativo em inglês, com prefixo de tipo: `feat:`, `fix:`, `chore:`, `docs:`,
`test:`, `refactor:`. O corpo explica o **porquê** quando não for óbvio.

## Pull Requests

O [modelo de PR](.github/pull_request_template.md) traz o checklist da Definition of Done
(testes unitários/integração/segurança, portões de lint/tipos, ausência de segredos). Preencha-o.
Descreva o que mudou e por quê, e referencie a issue quando houver.
