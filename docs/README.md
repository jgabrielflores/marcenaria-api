# Documentação técnica — Ramos Planejados

Documentação aprofundada da plataforma de gestão de pedidos. Para uma visão geral do projeto, consulte o [README principal](../README.md).

## Índice

| Documento | Conteúdo |
|---|---|
| [arquitetura.md](arquitetura.md) | Arquitetura em camadas, fluxos de requisição, topologia de deploy |
| [api.md](api.md) | Referência completa da API REST — endpoints, payloads, respostas, códigos de status |
| [regras-de-negocio.md](regras-de-negocio.md) | Regras de negócio, máquina de estados do pedido, matriz de permissões |
| [modelo-de-dados.md](modelo-de-dados.md) | Diagrama entidade-relacionamento, tabelas, índices e relacionamentos |
| [seguranca.md](seguranca.md) | Modelo de segurança, mitigações OWASP, testes adversariais |
| [desenvolvimento.md](desenvolvimento.md) | Setup do ambiente, fluxo de trabalho, comandos e *troubleshooting* |

## Diagramas de fluxo (draw.io)

Além dos diagramas Mermaid embutidos nos documentos acima, a pasta `docs/` contém fluxogramas editáveis em formato draw.io. Para visualizar: acesse [app.diagrams.net](https://app.diagrams.net/) → **Arquivo → Abrir do dispositivo**.

| Arquivo | Conteúdo |
|---|---|
| `fluxo-status.drawio` | Máquina de estados — os 7 status e suas transições |
| `fluxo-comprador.drawio` | Jornada do comprador (cadastro → pedido → acompanhamento) |
| `fluxo-admin.drawio` | Jornada do administrador (dashboard → gestão de pedidos) |
| `fluxo-pedido.drawio` | Ciclo de vida de um pedido na perspectiva do sistema |

## Convenções

- **Código-fonte, identificadores e comentários:** inglês.
- **Texto exibido ao usuário final** (rótulos de UI, mensagens de erro): português (Brasil).
- **Esta documentação:** português (Brasil).
- Os contratos de API canônicos vivem na documentação interativa **Swagger UI** em `/docs` (a API gera a especificação OpenAPI automaticamente).
