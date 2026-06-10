# Deploy - Railway

Como a aplicação está publicada: ambientes, URLs ao vivo, estrutura no Railway e como o deploy
acontece. Para o **processo** de promoção de código (branches, PRs, CI/CD), veja
[fluxo-de-trabalho.md](fluxo-de-trabalho.md); para a **topologia** da arquitetura, veja
[arquitetura.md](arquitetura.md).

## Ambientes e URLs

Dois ambientes isolados, cada um alimentado por uma branch e com banco e segredos próprios.

| Ambiente | Branch | Site (frontend) | API (backend) | Health |
|---|---|---|---|---|
| **Staging** | `develop` | https://ramos-planejados-staging.up.railway.app | https://ramos-planejados-api-staging.up.railway.app | `/health` |
| **Produção** | `main` | https://ramos-planejados.up.railway.app | https://ramos-planejados-api.up.railway.app | `/health` |

Um teste em staging **nunca** toca os dados de produção: bancos e segredos são separados por
ambiente.

## Estrutura no Railway

Projeto único **`ramos-planejados`**, com dois *environments* (`staging` e `production`). Cada
environment tem os mesmos três serviços:

| Serviço | Origem | Build | Observações |
|---|---|---|---|
| **FrontEnd** | `frontend/` | Nixpacks | `frontend/railway.json` (builder NIXPACKS, `npm start`, health `/`) + `frontend/.nvmrc` = 22 |
| **BackEnd** | `src/` | Docker | `Dockerfile` da raiz; `entrypoint.sh` roda migrações + seed do admin no boot; health `/health` |
| **Postgres** | template gerenciado | - | PostgreSQL 16 gerenciado pela Railway |

> Cada serviço precisa do seu próprio arquivo de configuração: sem o `frontend/railway.json`, o
> FrontEnd tentaria usar o `Dockerfile` do backend e falharia no build.

## Como o deploy acontece

O deploy é **disparado pelo GitHub**, não manualmente:

```
git push / merge  ->  GitHub  ->  Railway (build + deploy automático)
```

- O Railway observa o repositório e faz **deploy automático por branch**: merge em `develop`
  publica em **staging**; merge em `main` publica em **produção**.
- **BackEnd:** a imagem Docker (Python 3.12-slim, usuário não-root, configuração 12-factor via
  ambiente, porta em `$PORT`) sobe e o `entrypoint.sh` aplica as migrações Alembic e o seed do
  admin antes de iniciar o servidor.
- **FrontEnd:** o Nixpacks builda o Next.js e roda `npm start`. O `NEXT_PUBLIC_API_URL` é uma
  variável **de build** - mudá-la exige um **rebuild** do FrontEnd, não apenas um restart.
- **Banco:** o `DATABASE_URL` de cada serviço é uma **referência** ao Postgres do mesmo
  ambiente (`${{Postgres.DATABASE_URL}}`); nunca é digitado à mão.
- **E-mail:** a Railway bloqueia portas SMTP de saída, então a verificação de e-mail é enviada
  pela **API HTTPS da Brevo** (ver [seguranca.md](seguranca.md) e [api.md](api.md)).

## Variáveis de ambiente por ambiente

Os **valores** vivem apenas no painel do Railway (nunca no repositório). A lista completa de
nomes e defaults está na [tabela de variáveis do README](../README.md#variáveis-de-ambiente).
A divisão por ambiente:

| Categoria | Variáveis | Regra |
|---|---|---|
| **Diferentes por ambiente** | `SECRET_KEY`, `ADMIN_PASSWORD` | nunca reaproveitar entre staging e produção |
| **Específicas do ambiente** | `FRONTEND_ORIGIN`, `API_BASE_URL`, `NEXT_PUBLIC_API_URL` | apontam para as URLs daquele ambiente |
| **Compartilhadas** | `BREVO_API_KEY`, `EMAIL_FROM`, `EMAIL_FROM_NAME`, `ADMIN_EMAIL`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES` | mesmo valor nos dois |
| **Automática** | `DATABASE_URL` | referência `${{Postgres.DATABASE_URL}}` |

`ENV=production` nos **dois** ambientes da nuvem (logs em JSON); `development` é apenas para rodar
local com `docker-compose`.

## Operação básica

Comandos úteis (Railway CLI) para inspecionar um ambiente:

```bash
# Saúde da API (sem autenticação)
curl -s -o /dev/null -w "%{http_code}\n" https://ramos-planejados-api.up.railway.app/health

# Status dos serviços e logs (requer estar logado / token do ambiente)
railway status
railway logs --service BackEnd
```

> Renomear um *environment* e editar o subdomínio `*.up.railway.app` de um serviço são feitos
> pelo **painel** da Railway. Definir variáveis pode ser feito pela CLI
> (`railway variables --service <serviço> --set "CHAVE=valor"`) ou pelo painel; alterar uma
> variável dispara um novo deploy do serviço.
