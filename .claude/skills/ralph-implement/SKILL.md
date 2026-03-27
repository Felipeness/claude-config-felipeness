---
name: ralph-implement
description: Autonomous implementation loop with phase orchestration. Reads a Jira card, implements with TDD, runs extra tests, optimizes perf if needed, updates docs, and opens PR. Each phase is a sub-loop with clean context. Input — Jira ticket ID (e.g., CC-1234).
---

# Ralph Loop v2 — Implement (Orquestrador Master)

Loop autonomo com **5 fases sequenciais**:
1. **implement** — Implementar criterios de aceite com TDD
2. **test** — Garantir coverage e testes extras
3. **perf** — Otimizar performance (se houver target)
4. **docs** — Atualizar documentacao (se houver gaps)
5. **pr** — Abrir PR com resumo completo

## Input

O usuario fornece o ticket do Jira: `CC-1234` (ou URL completa).

## Arquitetura

Este skill usa o **loop externo com fases** (ralph-runner.js):
- Primeira iteracao roda AQUI (Claude interativo) — tem acesso a MCP, browser, Jira
- O runner executa fases sequencialmente, cada uma com seu proprio prompt e completion criteria
- Fases opcionais (perf, docs) sao puladas automaticamente se nao aplicaveis
- Todo estado persiste em `.claude/ralph-state/<TICKET_ID>/`

## Primeira Iteracao (interativa — VOCE FAZ ISSO AGORA)

### 1. Criar branch
```bash
git checkout -b feat/<TICKET_ID>-<descricao-curta>
```

### 2. Buscar card do Jira
- Use browser MCP ou `gh` para acessar o card
- Extraia TODOS os criterios de aceite
- Extraia contexto relevante (descricao, comentarios, links)
- Identifique se ha requisitos de performance (ex: "resposta < 200ms")
- Identifique se ha requisitos de documentacao (ex: "atualizar Swagger")

### 3. Criar state files

Crie o diretorio: `.claude/ralph-state/<TICKET_ID>/`

**phases.json** (o runner le isso para orquestrar as fases):
```json
[
  {
    "name": "implement",
    "status": "pending",
    "maxIterations": 10,
    "completionPromise": "IMPLEMENT_DONE"
  },
  {
    "name": "test",
    "status": "pending",
    "maxIterations": 5,
    "completionPromise": "TESTS_DONE",
    "skipIf": "no_test_gaps"
  },
  {
    "name": "perf",
    "status": "pending",
    "maxIterations": 5,
    "completionPromise": "PERF_DONE",
    "skipIf": "no_perf_target"
  },
  {
    "name": "docs",
    "status": "pending",
    "maxIterations": 3,
    "completionPromise": "DOCS_DONE",
    "skipIf": "no_doc_gaps"
  },
  {
    "name": "pr",
    "status": "pending",
    "maxIterations": 1,
    "completionPromise": "DONE"
  }
]
```

**progress.md:**
```markdown
# Progress — <TICKET_ID>

## Criterios de Aceite
- [ ] Criterio 1: <descricao extraida do Jira>
- [ ] Criterio 2: <descricao extraida do Jira>
- [ ] ...

## Test Coverage
(se aplicavel — se NAO tiver gaps, a fase test sera pulada)
- [ ] Testes para criterio 1
- [ ] Testes para criterio 2
- [ ] Edge cases: <lista>
- Coverage target: <N>%

## Performance Target
(se aplicavel — se NAO tiver target, a fase perf sera pulada)
- Metrica: <nome>
- Target: <valor>
- Baseline: <a medir>

## Documentation
(se aplicavel — se NAO tiver gaps, a fase docs sera pulada)
- [ ] JSDoc para funcoes publicas novas
- [ ] Swagger para endpoints novos
- [ ] README se necessario

## Status
- Total criterios: N
- Feitos: 0
- Pendentes: N
```

**journal.md:**
```markdown
# Ralph Journal — <TICKET_ID>

Task: <titulo do card>
Tipo: implement (orchestrated)
Fases: implement → test → perf → docs → pr
Inicio: <data/hora>
```

**prompt-implement.md** (fase 1 — implementacao com TDD):
```markdown
Voce esta na FASE IMPLEMENT do card Jira <TICKET_ID>: <titulo>.

## Contexto do Jira
<descricao completa do card copiada aqui>

## Abordagem por criterio

Para CADA criterio de aceite, siga TDD:

1. **Red**: Escreva um teste que valida o criterio. Rode — deve FALHAR
2. **Green**: Implemente o minimo para o teste passar. Rode — deve PASSAR
3. **Refactor**: Limpe se necessario, mantendo testes verdes

## Regras de debug

Se um criterio FALHAR em 2+ iteracoes (verifique no journal.md):
1. Leia as tentativas anteriores no journal
2. NAO repita a mesma abordagem
3. Tente uma abordagem completamente diferente
4. Registre no journal: por que a nova abordagem, o que mudou

## Regras
- Rode `tsc --noEmit` (se TypeScript) antes de commitar
- Rode a suite de testes completa
- Commits: feat(<TICKET_ID>): descricao
- 1 criterio por iteracao

## Quando terminar esta fase
Quando TODOS os criterios de aceite estiverem [x] no progress.md E testes passarem:
- Output: <promise>IMPLEMENT_DONE</promise>
```

**prompt-test.md** (fase 2 — testes extras e coverage):
```markdown
Voce esta na FASE TEST do card <TICKET_ID>.
A implementacao ja esta feita (fase anterior). Agora garanta qualidade dos testes.

## O que fazer

1. Leia o progress.md — secao "Test Coverage"
2. Identifique testes faltando:
   - Edge cases nao cobertos
   - Error paths
   - Testes de integracao (se aplicavel)
3. Escreva os testes faltantes
4. Rode a suite completa — tudo deve passar
5. Verifique coverage (se target definido)
6. Commite: test(<TICKET_ID>): add tests for <descricao>
7. Atualize progress.md e journal.md

## Quando terminar
Quando todos os items em "Test Coverage" estiverem [x] E coverage >= target:
- Output: <promise>TESTS_DONE</promise>
```

**prompt-perf.md** (fase 3 — performance):
```markdown
Voce esta na FASE PERF do card <TICKET_ID>.
A implementacao e testes ja estao feitos. Agora otimize performance.

## O que fazer

1. Leia o progress.md — secao "Performance Target"
2. Rode benchmark baseline (mesmo comando que sera usado para medir depois)
3. Identifique bottlenecks no codigo implementado
4. Aplique otimizacao
5. Re-benchmark — comparar antes/depois
6. Se melhorou: commite perf(<TICKET_ID>): <descricao>
7. Se nao melhorou ou piorou: reverta e tente outra abordagem
8. Atualize journal.md com metricas antes/depois

## Quando terminar
Quando metrica atual <= target E testes continuam passando:
- Output: <promise>PERF_DONE</promise>
```

**prompt-docs.md** (fase 4 — documentacao):
```markdown
Voce esta na FASE DOCS do card <TICKET_ID>.
Implementacao, testes e perf ja estao feitos. Agora atualize documentacao.

## O que fazer

1. Leia o progress.md — secao "Documentation"
2. Para cada item pendente:
   - JSDoc/TSDoc: descricao, @param, @returns, @throws, @example
   - Swagger/OpenAPI: path, method, params, responses, examples
   - README: secao relevante com exemplos
3. Commite: docs(<TICKET_ID>): <descricao>
4. Atualize progress.md e journal.md

## Quando terminar
Quando todos os items em "Documentation" estiverem [x]:
- Output: <promise>DOCS_DONE</promise>
```

**prompt-pr.md** (fase 5 — abrir PR):
```markdown
Voce esta na FASE PR do card <TICKET_ID>.
TUDO esta feito. Abra o PR final.

## O que fazer

1. Leia o journal.md — faca um resumo do que foi implementado
2. Leia o progress.md — confirme que tudo esta [x]
3. Rode testes uma ultima vez (sanity check)
4. Abra o PR:
   ```bash
   gh pr create \
     --title "feat(<TICKET_ID>): <titulo do card>" \
     --body "$(cat <<'EOF'
   ## Summary
   <resumo baseado no journal — o que foi implementado, decisoes tomadas>

   ## Acceptance Criteria
   <lista dos criterios com ✅>

   ## Test plan
   - <testes adicionados>
   - Coverage: <N>%

   Jira: https://superlogica.atlassian.net/browse/<TICKET_ID>
   EOF
   )"
   ```
5. Output: <promise>DONE</promise>
```

### 4. Implementar o primeiro criterio

Siga o fluxo TDD para o primeiro criterio:
1. Escreva o teste (Red)
2. Rode (deve falhar)
3. Implemente (Green)
4. Rode (deve passar)
5. Commite
6. Atualize progress.md e journal.md

### 5. Lancar o runner em background

Apos completar o primeiro criterio, lance o loop externo:

```bash
node ~/.claude/scripts/ralph-runner.js \
  --task-type implement \
  --task-id <TICKET_ID> \
  --max-iterations 30 \
  --cwd "$(pwd)" &
```

Informe ao usuario:
- "Ralph Loop lancado em background com 5 fases: implement → test → perf → docs → pr"
- "Monitore com: `tail -f .claude/ralph-state/<TICKET_ID>/output.log`"
- "Cancele com: `/ralph-cancel`"
- "Fases perf e docs serao puladas automaticamente se nao forem aplicaveis"

## Como o Runner Trabalha

```
Pipeline:
  ┌─ Fase 1: IMPLEMENT (max 10 iter) ──────────────┐
  │ Para cada criterio: Red → Green → Refactor      │
  │ Se falhou 2x: muda abordagem                    │
  │ Promise: IMPLEMENT_DONE                          │
  └──────────────────────────────────────────────────┘
       │ ✅
  ┌─ Fase 2: TEST (max 5 iter, skip se sem gaps) ──┐
  │ Edge cases, error paths, integracao              │
  │ Coverage target                                  │
  │ Promise: TESTS_DONE                              │
  └──────────────────────────────────────────────────┘
       │ ✅
  ┌─ Fase 3: PERF (max 5 iter, skip se sem target) ┐
  │ Benchmark → otimiza → re-benchmark               │
  │ Promise: PERF_DONE                               │
  └──────────────────────────────────────────────────┘
       │ ✅
  ┌─ Fase 4: DOCS (max 3 iter, skip se sem gaps) ──┐
  │ JSDoc, Swagger, README                           │
  │ Promise: DOCS_DONE                               │
  └──────────────────────────────────────────────────┘
       │ ✅
  ┌─ Fase 5: PR (1 iter) ──────────────────────────┐
  │ Abre PR com resumo do journal                    │
  │ Promise: DONE                                    │
  └──────────────────────────────────────────────────┘
```

## Journal Adaptativo

**Sucesso na primeira tentativa (2-3 linhas):**
```markdown
## Iteracao 2 ✅ [fase: implement]
- Criterio: "criar endpoint POST /users"
- Resultado: Sucesso na primeira tentativa
- Commit: feat(CC-1234): add POST /users endpoint
```

**Falha seguida de correcao (detalhe completo):**
```markdown
## Iteracao 3 ⚠️ [fase: implement]
- Criterio: "validar CPF no cadastro"
- Tentativa 1: Schema Zod flat → TypeError: Cannot read property 'parse'
- Tentativa 2: z.object() com nested validation → testes passaram
- Decisao: Usei cpf-cnpj-validator lib (ja existia no projeto)
- Licao: Checar deps existentes antes de implementar validacao custom
- Commit: feat(CC-1234): add CPF validation
- Testes: 18 passed, 0 failed
```

**Transicao de fase:**
```markdown
## Fase implement CONCLUIDA ✅
- Criterios implementados: 5/5
- Testes: 42 passed, 0 failed
- Iniciando fase: test
```
