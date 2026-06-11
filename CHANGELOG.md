# Changelog

Todas as mudanças relevantes deste projeto são documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto adota
[Versionamento Semântico](https://semver.org/lang/pt-BR/). As versões abaixo acompanham os marcos
do PRD (v1.2 = MVP, v2.0 = expansão de gestão de pedidos). O deploy é contínuo no Railway
(`develop` -> staging, `main` -> produção), então cada versão reflete um conjunto de recursos
promovido para produção.

## [Não lançado]

### Adicionado

- **Fotos do ambiente no pedido**: cliente (e admin, em pedidos de balcão) anexa até 5 imagens
  por pedido enquanto ele está em `AGUARDANDO_ANALISE`. Os bytes são armazenados em PostgreSQL
  (`BYTEA`), sem object storage externo. Upload, download autenticado e remoção via
  `/api/v1/orders/{id}/images`. O backend valida o conteúdo real da imagem com Pillow
  (JPEG/PNG/WebP, 5 MB cada), não apenas o `Content-Type` declarado.

## [2.0.0] - 2026-06-10

Expansão de gestão de pedidos (PRD v2.0).

### Adicionado

- Ciclo de vida de pedido com **7 estados** e máquina de transições validada no backend.
- Histórico de status (append-only) por pedido, com origem, destino e nota de cada transição.
- Painel de métricas do admin com **controle financeiro** (valor do projeto, custo estimado,
  lucro e faturamento do mês) e contagem de pedidos atrasados.
- **Verificação de e-mail** no registro: token com validade de 24 h, enviado pela API HTTPS da
  Brevo (em desenvolvimento, o link é registrado no log em vez de enviado).
- **Pedidos de balcão**: o admin cria pedidos para clientes sem conta (`client_name`,
  `client_email`).
- Perfil do usuário: alterar nome e trocar a senha.
- Numeração sequencial e única de pedidos (`order_number`).
- Ambientes isolados de **staging** (`develop`) e **produção** (`main`) no Railway, com banco e
  segredos próprios por ambiente.

### Modificado

- Serialização de pedido por papel: campos financeiros e dados de balcão ficam ocultos para o
  cliente; o `project_value` só aparece para o cliente depois que o pedido sai de
  `AGUARDANDO_ANALISE`.

## [1.0.0] - 2026-05-20

MVP inicial (PRD v1.2).

### Adicionado

- Autenticação JWT com registro e login; papéis `CUSTOMER` e `ADMIN`.
- CRUD de pedidos com escopo por dono: o cliente vê apenas os próprios pedidos; o admin vê todos.
- Hash de senha com bcrypt, CORS restrito ao `FRONTEND_ORIGIN` e rate limiting no login.
- Frontend Next.js 16: landing page, área do cliente (`/conta`) e painel admin (`/admin`).
- Deploy no Railway (backend em Docker, frontend via Nixpacks, PostgreSQL gerenciado) com
  pipeline de CI: lint, checagem de tipos, testes e cobertura mínima de 90%.
