---
name: ralph-implement
description: Autonomous implementation loop with phase orchestration. Works WITH a Jira card OR a free-form description. Implements with TDD, runs extra tests, optimizes perf if needed, updates docs, self-reviews, and opens PR. Each phase is a sub-loop with clean context. Input — Jira ticket ID (e.g., CC-1234) OR a free-form task description.
---

# Ralph Loop v2 — Implement (Orquestrador Master)

Loop autonomo com **6 fases sequenciais**:
1. **implement** — Implementar criterios de aceite com TDD
2. **test** — Garantir coverage e testes extras
3. **perf** — Otimizar performance (se houver target)
4. **docs** — Atualizar documentacao (se houver gaps)
5. **review** — Self-review com `/code-review --fix` antes do PR
6. **pr** — Abrir PR com resumo completo

## Input — dois modos

O runner aceita qualquer identificador como `--task-id`. Detecte o modo pelo input:

| | **Modo Jira** | **Modo Freeform (sem card)** |
|---|---|---|
| Trigger | Input casa `^[A-Z]+-\d+$` (ex: `CC-1234`) ou URL do Jira | Qualquer outra descricao livre |
| `TASK_ID` | `CC-1234` | slug kebab-case (ex: `add-csv-export`) |
| Criterios de aceite | Extraidos do card | **Definidos com o usuario ANTES de lançar** (gate abaixo) |
| Branch | `feat/CC-1234-descricao-curta` | `feat/add-csv-export` |
| Commit | `feat(CC-1234): descricao` | `feat: descricao` (sem scope) |
| Titulo do PR | `feat(CC-1234): titulo` | `feat: titulo` |
| Linha Jira no PR | `Jira: https://superlogica.atlassian.net/browse/CC-1234` | `Jira: N/A (freeform)` |

> Daqui pra frente, `<TASK_ID>` = ticket OU slug, e `<SCOPE>` = `(CC-1234)` no modo Jira ou **vazio** no freeform. Sempre respeite as convencoes de commit/branch da CLAUDE.md (hook valida).

## Arquitetura

Este skill usa o **loop externo com fases** (ralph-runner.js):
- Primeira iteracao roda AQUI (Claude interativo) — tem acesso a MCP, browser, Jira
- O runner executa fases sequencialmente, cada uma com seu proprio prompt e completion criteria
- Fases opcionais (perf, docs) sao puladas automaticamente se nao aplicaveis
- Todo estado persiste em `.claude/ralph-state/<TASK_ID>/`

## Primeira Iteracao (interativa — VOCE FAZ ISSO AGORA)

### 0. Determinar modo e Definition of Done

**Modo Jira:**
- Use browser MCP (ou Atlassian MCP / `gh`) para acessar o card
- Extraia TODOS os criterios de aceite, descricao, comentarios, links
- Identifique requisitos de performance (ex: "resposta < 200ms") e documentacao (ex: "atualizar Swagger")

**Modo Freeform — GATE OBRIGATORIO:**
Ralph nao consegue loopar sem um alvo de conclusao testavel. Antes de criar qualquer state file:
1. Derive da descricao do usuario uma lista curta de **criterios de aceite testaveis** (3-7 itens, cada um verificavel por um teste ou comando)
2. Gere o `slug` kebab-case a partir da descricao (ex: "exportar relatorio em CSV" → `add-csv-export`)
3. **Confirme com o usuario** os criterios e o slug em uma unica mensagem antes de prosseguir. Se a descricao for vaga demais para criterios testaveis, faca 1-2 perguntas de clarificacao (nao mais)
4. So lance o loop apos o "ok" — esses criterios viram o `progress.md` e sao a unica fonte de "done"

### 1. Criar branch
```bash
# Jira:      git checkout -b feat/CC-1234-descricao-curta
# Freeform:  git checkout -b feat/add-csv-export
git checkout -b feat/<TASK_ID-ou-slug>-<descricao-curta>
```

### 2. Criar state files

Crie o diretorio: `.claude/ralph-state/<TASK_ID>/`

**phases.json** (o runner le isso para orquestrar as fases):
```json
[
  { "name": "implement", "status": "pending", "maxIterations": 10, "completionPromise": "IMPLEMENT_DONE" },
  { "name": "test", "status": "pending", "maxIterations": 5, "completionPromise": "TESTS_DONE", "skipIf": "no_test_gaps" },
  { "name": "perf", "status": "pending", "maxIterations": 5, "completionPromise": "PERF_DONE", "skipIf": "no_perf_target" },
  { "name": "docs", "status": "pending", "maxIterations": 3, "completionPromise": "DOCS_DONE", "skipIf": "no_doc_gaps" },
  { "name": "review", "status": "pending", "maxIterations": 3, "completionPromise": "REVIEW_DONE" },
  { "name": "pr", "status": "pending", "maxIterations": 1, "completionPromise": "DONE" }
]
```

**progress.md:**
```markdown
# Progress — <TASK_ID>

## Criterios de Aceite
(modo Jira: extraidos do card | modo freeform: confirmados com o usuario no gate)
- [ ] Criterio 1: <descricao>
- [ ] Criterio 2: <descricao>
- [ ] ...

## Test Coverage
(se aplicavel — se NAO tiver gaps, a fase test sera pulada)
- [ ] Testes para criterio 1
- [ ] Edge cases: <lista>
- Coverage target: <N>%

## Performance Target
(se aplicavel — se NAO tiver target, a fase perf sera pulada)
- Metrica: <nome> | Target: <valor> | Baseline: <a medir>

## Documentation
(se aplicavel — se NAO tiver gaps, a fase docs sera pulada)
- [ ] JSDoc para funcoes publicas novas
- [ ] Swagger para endpoints novos
- [ ] README se necessario

## Status
- Total criterios: N | Feitos: 0 | Pendentes: N
```

**journal.md:**
```markdown
# Ralph Journal — <TASK_ID>

Task: <titulo do card OU descricao do usuario>
Modo: jira | freeform
Tipo: implement (orchestrated)
Fases: implement → test → perf → docs → review → pr
Inicio: <data/hora>
```

**prompt-implement.md** (fase 1 — implementacao com TDD):
```markdown
Voce esta na FASE IMPLEMENT da task <TASK_ID>: <titulo>.

## Contexto
<modo Jira: descricao completa do card | modo freeform: descricao do usuario + criterios confirmados>

## Abordagem por criterio
Para CADA criterio de aceite, siga TDD:
1. **Red**: Escreva um teste que valida o criterio. Rode — deve FALHAR
2. **Green**: Implemente o minimo para o teste passar. Rode — deve PASSAR
3. **Refactor**: Limpe se necessario, mantendo testes verdes

## Regras de debug
Se um criterio FALHAR em 2+ iteracoes (verifique no journal.md):
1. Leia as tentativas anteriores no journal
2. NAO repita a mesma abordagem — tente uma completamente diferente
3. Registre no journal: por que a nova abordagem, o que mudou

## Regras
- Rode `tsc --noEmit` (TS) / `go build ./...` (Go) / typecheck da linguagem antes de commitar
- Rode a suite de testes completa
- Commits: feat<SCOPE>: descricao   (Jira: feat(CC-1234): ... | freeform: feat: ...)
- 1 criterio por iteracao

## Quando terminar esta fase
Quando TODOS os criterios estiverem [x] no progress.md E testes passarem:
- Output: <promise>IMPLEMENT_DONE</promise>
```

**prompt-test.md** (fase 2 — testes extras e coverage):
```markdown
Voce esta na FASE TEST da task <TASK_ID>.
A implementacao ja esta feita. Agora garanta qualidade dos testes.

1. Leia o progress.md — secao "Test Coverage"
2. Identifique testes faltando: edge cases, error paths, integracao
3. Escreva os testes faltantes
4. Rode a suite completa — tudo deve passar
5. Verifique coverage (se target definido)
6. Commite: test<SCOPE>: add tests for <descricao>
7. Atualize progress.md e journal.md

## Quando terminar
Quando todos os items em "Test Coverage" estiverem [x] E coverage >= target:
- Output: <promise>TESTS_DONE</promise>
```

**prompt-perf.md** (fase 3 — performance):
```markdown
Voce esta na FASE PERF da task <TASK_ID>.
Implementacao e testes feitos. Agora otimize performance.

1. Leia o progress.md — secao "Performance Target"
2. Rode benchmark baseline (mesmo comando que sera usado para medir depois)
3. Identifique bottlenecks no codigo implementado
4. Aplique otimizacao
5. Re-benchmark — comparar antes/depois
6. Melhorou: commite perf<SCOPE>: <descricao>. Piorou/igual: reverta e tente outra abordagem
7. Atualize journal.md com metricas antes/depois

## Quando terminar
Quando metrica atual <= target E testes continuam passando:
- Output: <promise>PERF_DONE</promise>
```

**prompt-docs.md** (fase 4 — documentacao):
```markdown
Voce esta na FASE DOCS da task <TASK_ID>.
Implementacao, testes e perf feitos. Agora atualize documentacao.

1. Leia o progress.md — secao "Documentation"
2. Para cada item pendente:
   - JSDoc/TSDoc: descricao, @param, @returns, @throws, @example
   - Swagger/OpenAPI: path, method, params, responses, examples
   - README: secao relevante com exemplos
3. Commite: docs<SCOPE>: <descricao>
4. Atualize progress.md e journal.md

## Quando terminar
Quando todos os items em "Documentation" estiverem [x]:
- Output: <promise>DOCS_DONE</promise>
```

**prompt-review.md** (fase 5 — self-review antes do PR):
```markdown
Voce esta na FASE REVIEW da task <TASK_ID>.
Implementacao, testes, perf e docs feitos. Faca self-review antes de abrir o PR.

1. Rode `/code-review high --fix` no diff da branch — caca bugs e aplica correcoes seguras no working tree
2. Issues que o --fix nao resolveu sozinho: corrija manualmente, 1 por vez, rodando testes apos cada
3. Rode a suite completa — tudo verde
4. Confirme no progress.md que todos os criterios continuam [x]
5. Se houve mudanca, commite: refactor<SCOPE>: address self-review findings
6. Atualize journal.md com os findings e o que foi corrigido

## Quando terminar
Quando nao restar issue bloqueante E testes verdes:
- Output: <promise>REVIEW_DONE</promise>
```

**prompt-pr.md** (fase 6 — abrir PR):
```markdown
Voce esta na FASE PR da task <TASK_ID>.
TUDO esta feito. Abra o PR final.

1. Leia o journal.md — resuma o que foi implementado
2. Leia o progress.md — confirme que tudo esta [x]
3. Rode testes uma ultima vez (sanity check)
4. Abra o PR:
   ```bash
   gh pr create \
     --title "feat<SCOPE>: <titulo da task>" \
     --body "$(cat <<'EOF'
   ## Summary
   <resumo baseado no journal — o que foi implementado, decisoes tomadas>

   ## Acceptance Criteria
   <lista dos criterios com ✅>

   ## Test plan
   - <testes adicionados>
   - Coverage: <N>%

   Jira: <modo Jira: https://superlogica.atlassian.net/browse/CC-1234 | freeform: N/A (freeform)>
   EOF
   )"
   ```
5. Output: <promise>DONE</promise>
```

### 3. Implementar o primeiro criterio

Siga o fluxo TDD para o primeiro criterio: teste (Red) → roda (falha) → implementa (Green) → roda (passa) → commita → atualiza progress.md e journal.md.

### 4. Lancar o runner em background

Apos completar o primeiro criterio, lance o loop externo:

```bash
node ~/.claude/scripts/ralph-runner.js \
  --task-type implement \
  --task-id <TASK_ID> \
  --max-iterations 30 \
  --cwd "$(pwd)" &
```

Informe ao usuario:
- "Ralph Loop lancado em background com 6 fases: implement → test → perf → docs → review → pr"
- "Modo: <jira CC-1234 | freeform: add-csv-export>"
- "Monitore com: `tail -f .claude/ralph-state/<TASK_ID>/output.log`"
- "Cancele com: `/ralph-cancel`"
- "Fases perf e docs sao puladas automaticamente se nao forem aplicaveis"

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
  │ Edge cases, error paths, integracao / coverage   │
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
  ┌─ Fase 5: REVIEW (max 3 iter) ──────────────────┐
  │ /code-review high --fix → corrige → testes verdes │
  │ Promise: REVIEW_DONE                             │
  └──────────────────────────────────────────────────┘
       │ ✅
  ┌─ Fase 6: PR (1 iter) ──────────────────────────┐
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
- Commit: feat(CC-1234): add POST /users endpoint   (freeform: feat: add POST /users endpoint)
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
