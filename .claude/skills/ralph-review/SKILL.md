---
name: ralph-review
description: Autonomous PR review and fix loop. Runs pr-jira-review, fixes blocking findings, re-checks, and loops with clean context until no blocking issues remain. Input — PR number or URL.
---

# Ralph Loop v2 — Review

Loop autonomo que revisa um PR, corrige findings blocking, e repete com contexto limpo ate o PR estar limpo.

## Input

O usuario fornece o PR: `#15` ou URL completa.

## Primeira Iteracao (interativa — VOCE FAZ ISSO AGORA)

### 1. Buscar dados do PR
```bash
gh pr view <PR> --json title,body,baseRefName,headRefName,url
gh pr diff <PR>
```

### 2. Rodar pipeline de review completo

Execute o pipeline pr-jira-review:
- **Fase 1**: Busque o card do Jira linkado, extraia criterios de aceite
- **Fase 2**: Ultrathink Review (SOLID/DRY/KISS/YAGNI/CUPID)
- **Fase 3**: Simplify (reuso, eficiencia, dead code)

### 3. Criar state files

Crie o diretorio: `.claude/ralph-state/pr-<PR_NUMBER>/`

**progress.md:**
```markdown
# Progress — PR #<NUMBER>

## Findings Blocking
- [ ] Finding 1: <descricao> (arquivo:linha)
- [ ] Finding 2: <descricao> (arquivo:linha)

## Findings Non-Blocking (sugestoes)
- Sugestao 1: <descricao>
- Sugestao 2: <descricao>

## Status
- Blocking: N pendentes
- Resolvidos: 0
```

**findings.md:**
```markdown
# Review Findings — PR #<NUMBER>

## [blocking] Finding 1: <titulo>
- Arquivo: <path:line>
- Problema: <descricao detalhada>
- Severidade: alta
- Sugestao de fix: <como corrigir>

## [blocking] Finding 2: <titulo>
...

## [non-blocking] Sugestao 1: <titulo>
- Arquivo: <path:line>
- Problema: <descricao>
- Sugestao: <melhoria proposta>
```

**journal.md:**
```markdown
# Ralph Journal — PR #<NUMBER>

Task: Review PR #<NUMBER> - <titulo>
Tipo: review
Inicio: <data/hora>
```

**prompt.md:**
```markdown
Voce esta corrigindo findings blocking do PR #<NUMBER>.

## Contexto do PR
<titulo e descricao do PR>
Branch: <head> → <base>

## Abordagem

1. Leia findings.md — identifique o proximo finding [blocking] nao resolvido
2. Leia o codigo fonte do arquivo afetado
3. Aplique o fix
4. Rode testes (tsc --noEmit + suite de testes)
5. Commite: fix(<TICKET>): descricao do fix
6. Atualize progress.md e journal.md
7. Se ZERO findings [blocking] pendentes:
   - Poste review comments inline no GitHub via `gh`:
     * Findings blocking resolvidos — como foram corrigidos
     * Findings non-blocking — como sugestoes
   - Output: <promise>DONE</promise>

## Regras
- 1 finding por iteracao
- Non-blocking NAO sao corrigidos automaticamente — viram comments
- Se um fix quebra testes, corrija na mesma iteracao antes de commitar
```

### 4. Corrigir o primeiro finding blocking
- Aplique o fix
- Rode testes
- Commite
- Atualize progress.md e journal.md

### 5. Lancar o runner em background

```bash
node ~/.claude/scripts/ralph-runner.js \
  --task-type review \
  --task-id "pr-<PR_NUMBER>" \
  --max-iterations 5 \
  --completion-promise "DONE" \
  --cwd "$(pwd)" &
```

Informe ao usuario:
- "Ralph Review lancado em background"
- "Monitore com: `tail -f .claude/ralph-state/pr-<PR_NUMBER>/output.log`"
- "Cancele com: `/ralph-cancel`"
