---
name: ralph-review
description: Autonomous PR review and fix loop. Runs pr-jira-review, fixes blocking findings, re-checks, and loops until no blocking issues remain. Input — PR number or URL. Use when you want Claude to review AND fix a PR autonomously.
---

# Ralph Loop — Review

Loop autonomo que revisa um PR, corrige os findings blocking, e repete ate o PR estar limpo.

## Input

O usuario fornece o PR: `#15` ou URL completa.

## Setup

Ao receber o comando, IMEDIATAMENTE crie o state file `.claude/ralph-loop.local.md` no diretorio do projeto atual:

```markdown
---
iteration: 1
max_iterations: 5
completion_promise: DONE
task_type: review
task_input: <PR_NUMBER_OR_URL>
---

[Ralph Loop — review <PR>]

Voce esta em um loop autonomo de review. A cada iteracao:

1. Na PRIMEIRA iteracao:
   - Rode o pipeline completo do pr-jira-review:
     * Fase 1: Busque o card do Jira linkado, extraia criterios de aceite
     * Fase 2: Ultrathink Review (SOLID/DRY/KISS/YAGNI/CUPID)
     * Fase 3: Simplify (reuso, eficiencia, dead code)
   - Salve os findings em .claude/ralph-review-findings.md
   - Categorize: [blocking] vs [non-blocking]

2. Nas iteracoes SEGUINTES:
   - Leia .claude/ralph-review-findings.md
   - Identifique o proximo finding [blocking] nao resolvido
   - Aplique o fix no codigo
   - Rode testes (tsc --noEmit + suite de testes)
   - Se testes falharem: corrija antes de prosseguir
   - Commite: fix(<TICKET>): descricao do fix
   - Marque o finding como [resolvido] no findings file

3. Quando NAO houver mais findings [blocking]:
   - Poste review comments inline no GitHub (blocking resolvidos + non-blocking como sugestao)
   - Poste resumo no Jira
   - Output: <promise>DONE</promise>

IMPORTANTE:
- Corrija 1 finding por iteracao — foco e qualidade
- Non-blocking findings viram sugestoes no review, nao fixes automaticos
- NUNCA finja que terminou — so output <promise>DONE</promise> quando todos os blockings estiverem resolvidos
```

## Apos criar o state file

1. Busque o PR via `gh pr view` e `gh pr diff`
2. Execute o pipeline de review (Jira + Ultrathink + Simplify)
3. Crie o findings file com a lista categorizada
4. Comece a corrigir o primeiro finding blocking
