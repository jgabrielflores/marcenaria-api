<!--
  Preencha o checklist antes de pedir o merge. Itens que não se aplicam: marque e escreva "N/A".
  Política: toda alteração de comportamento entra com teste (Definition of Done).
-->

## O que muda e por quê

<!-- Descreva a alteração e a motivação em 1-3 frases. -->

## Tipo

- [ ] `feature` (nova funcionalidade)
- [ ] `fix` (correção de bug)
- [ ] `chore` / `docs` (manutenção, infra ou documentação)

## ✅ QA - Quality Engineer

- [ ] Adicionei/atualizei testes cobrindo o **caminho feliz** e o **principal caso de erro**.
- [ ] Backend: há teste de **integração** exercitando o ciclo HTTP, quando aplicável.
- [ ] Frontend: o arquivo alterado está coberto (adicionado ao `coverage.include` do `vitest.config.ts` se for novo).
- [ ] Rodei os **gates localmente** e estão verdes (`ruff` · `mypy` · `pytest --cov-fail-under=90` · `npm run lint/type-check/format:check/test:coverage/build`).
- [ ] Cobertura **não caiu** abaixo do mínimo (backend ≥ 90%; gate do frontend verde).

## 🔒 Segurança - Security Engineer

- [ ] Autenticação e **autorização** corretas (papel `CUSTOMER` vs `ADMIN`; sem IDOR).
- [ ] Entrada validada por schema (Pydantic no back; sem confiar no front).
- [ ] Sem **dado sensível** em resposta ou log (`password_hash`, tokens, PII).
- [ ] Sem segredo commitado; novas variáveis documentadas no `.env.example`.
- [ ] Endpoints sensíveis (auth/admin) têm teste de **segurança** cobrindo o vetor relevante.
- [ ] Nenhuma dependência nova fora da stack aprovada **sem aprovação explícita**.

## Validação

<!-- Como você testou? (local, staging) Cole evidência se útil. -->

---

> Os jobs **Backend** e **Frontend** são obrigatórios e precisam ficar verdes.
> Fluxo completo em [`docs/fluxo-de-trabalho.md`](../docs/fluxo-de-trabalho.md).
