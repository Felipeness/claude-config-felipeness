---
name: ralph-refactor
description: Autonomous refactoring loop. Applies refactoring steps incrementally, runs tests after each step, commits, and loops with clean context until the spec is fully implemented with green tests. Input — refactoring description or spec.
---

# Ralph Loop v2 — Refactor

Loop autonomo que aplica refactoring em passos incrementais com contexto limpo, garantindo testes verdes a cada passo.

## Input

O usuario fornece a descricao do refactoring:
- Texto livre: "extrair shared pagination helpers"
- Referencia a spec: "seguir o plano em REFACTOR_PLAN.md"

## Primeira Iteracao (interativa — VOCE FAZ ISSO AGORA)

### 1. Criar branch
```bash
git checkout -b refactor/<descricao-curta>
```

### 2. Analisar codebase

Antes de criar o plano:
- Leia o codigo afetado
- Identifique dependencias
- Rode testes (baseline — todos devem estar verdes)
- Entenda o escopo real do refactoring

### 3. Criar state files

Crie o diretorio: `.claude/ralph-state/<descricao-slug>/`

**plan.md:**
```markdown
# Refactoring Plan — <descricao>

## Objetivo
<o que este refactoring resolve>

## Steps

### Step 1: <titulo>
- [ ] O que fazer: <descricao detalhada>
- Arquivos afetados: <lista>
- Risco: baixo|medio|alto
- Rollback: <como reverter se quebrar>

### Step 2: <titulo>
- [ ] O que fazer: <descricao>
- Arquivos afetados: <lista>
- Risco: baixo|medio|alto
- Rollback: <como reverter>

...
```

**progress.md:**
```markdown
# Progress — Refactor: <descricao>

## Steps
- [ ] Step 1: <titulo>
- [ ] Step 2: <titulo>
- [ ] ...

## Status
- Total: N steps
- Feitos: 0
- Pendentes: N
- Testes: baseline verde
```

**journal.md:**
```markdown
# Ralph Journal — Refactor: <descricao>

Task: <descricao do refactoring>
Tipo: refactor
Inicio: <data/hora>
Baseline: todos os testes verdes (N testes)
```

**prompt.md:**
```markdown
Voce esta aplicando um refactoring incremental: <descricao>.

## Abordagem

1. Leia plan.md — identifique o proximo step pendente
2. Leia o step em detalhe (arquivos afetados, rollback)
3. Aplique o refactoring desse step
4. Rode testes (tsc --noEmit + suite de testes)
5. Se testes FALHAREM:
   - Tente corrigir na mesma iteracao
   - Se nao conseguir, reverta o step (rollback) e registre no journal
6. Se testes PASSAREM:
   - Commite: refactor(<scope>): descricao do step
   - Marque o step como feito no progress.md e plan.md
7. Se TODOS os steps feitos E testes verdes:
   - Faca review final (verificar que nada quebrou)
   - Output: <promise>DONE</promise>

## Regras
- 1 step por iteracao
- NUNCA quebre testes — se um step quebra, corrija ou reverta
- Se o plano precisar mudar (descobriu algo novo), atualize plan.md
- Commits incrementais — cada step e um commit separado
```

### 4. Aplicar o primeiro step

- Aplique o refactoring
- Rode testes (devem continuar verdes)
- Commite
- Atualize progress.md, plan.md e journal.md

### 5. Lancar o runner em background

```bash
node ~/.claude/scripts/ralph-runner.js \
  --task-type refactor \
  --task-id "<descricao-slug>" \
  --max-iterations 10 \
  --completion-promise "DONE" \
  --cwd "$(pwd)" &
```

Informe ao usuario:
- "Ralph Refactor lancado em background"
- "Monitore com: `tail -f .claude/ralph-state/<slug>/output.log`"
- "Cancele com: `/ralph-cancel`"
