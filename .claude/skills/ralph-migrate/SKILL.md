---
name: ralph-migrate
description: Autonomous migration loop. Plans and executes migrations incrementally (DB, API, framework, lib) with rollback safety at each step. Loops with clean context until migration is complete. Input — migration description.
---

# Ralph Loop v2 — Migrate

Loop autonomo de migracao incremental com rollback safety a cada step.

## Input

O usuario fornece:
- Descricao da migracao: "migrar de Express para Fastify"
- Versao alvo: "atualizar React 17 → 18"
- DB migration: "adicionar tabela de audit logs"
- Referencia: "seguir MIGRATION_PLAN.md"

## Primeira Iteracao (interativa — VOCE FAZ ISSO AGORA)

### 1. Criar branch
```bash
git checkout -b chore/migrate-<descricao-curta>
```

### 2. Analisar o estado atual

- Identifique versoes atuais (package.json, go.mod, etc.)
- Leia changelogs/breaking changes da versao alvo
- Rode testes (baseline — todos verdes)
- Identifique dependencias afetadas
- Mapeie incompatibilidades conhecidas

### 3. Criar state files

Crie o diretorio: `.claude/ralph-state/migrate-<descricao-slug>/`

**plan.md:**
```markdown
# Migration Plan — <descricao>

## De → Para
- Atual: <versao/framework/schema atual>
- Alvo: <versao/framework/schema alvo>

## Breaking Changes Identificados
1. <breaking change 1>
2. <breaking change 2>

## Steps (ordem importa!)

### Step 1: <titulo> [pre-requisito]
- [ ] O que fazer: <descricao>
- Arquivos afetados: <lista>
- Breaking change relacionado: <qual>
- Rollback: `git revert HEAD` (ou instrucao especifica)
- Validacao: <como verificar que funcionou>

### Step 2: <titulo>
- [ ] O que fazer: <descricao>
- Arquivos afetados: <lista>
- Rollback: <como reverter>
- Validacao: <como verificar>

...
```

**progress.md:**
```markdown
# Progress — Migration: <descricao>

## Steps
- [ ] Step 1: <titulo>
- [ ] Step 2: <titulo>
- [ ] ...

## Validacoes Finais
- [ ] Todos os testes passam
- [ ] Zero deprecation warnings
- [ ] Build funciona
- [ ] Nenhum breaking change pendente

## Status
- Total: N steps
- Feitos: 0
- Pendentes: N
- Testes: baseline verde
```

**journal.md:**
```markdown
# Ralph Journal — Migration: <descricao>

Task: <descricao da migracao>
Tipo: migrate
Inicio: <data/hora>
Baseline: todos os testes verdes
De: <versao atual>
Para: <versao alvo>
```

**prompt.md:**
```markdown
Voce esta executando uma migracao incremental: <descricao>.

## Abordagem

1. Leia plan.md — identifique o proximo step pendente
2. Leia o journal.md — veja o que aconteceu em steps anteriores
3. Aplique o step da migracao
4. Rode validacao especifica do step (descrita no plan.md)
5. Rode testes completos
6. Se testes PASSAREM:
   - Commite: chore(<scope>): migrate <descricao do step>
   - Marque como feito no progress.md e plan.md
7. Se testes FALHAREM:
   - Tente corrigir (pode ser adaptacao ao breaking change)
   - Se nao conseguir: REVERTA o step usando o rollback descrito no plan.md
   - Registre no journal o que falhou e por que
   - O proximo iteracao pode tentar uma abordagem diferente
8. Se TODOS os steps feitos + validacoes finais passam:
   - Output: <promise>DONE</promise>

## Regras
- 1 step por iteracao
- SEMPRE tenha rollback disponivel antes de aplicar um step
- Se um step quebra testes e voce nao consegue corrigir: REVERTA
- Registre incompatibilidades descobertas no journal (podem afetar steps futuros)
- Atualize plan.md se descobrir novos steps necessarios
```

### 4. Aplicar o primeiro step

- Aplique a mudanca
- Rode validacao + testes
- Commite
- Atualize progress.md, plan.md e journal.md

### 5. Lancar o runner em background

```bash
node ~/.claude/scripts/ralph-runner.js \
  --task-type migrate \
  --task-id "migrate-<descricao-slug>" \
  --max-iterations 15 \
  --completion-promise "DONE" \
  --cwd "$(pwd)" &
```
