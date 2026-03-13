---
name: ralph-implement
description: Autonomous implementation loop. Reads a Jira card, implements acceptance criteria one by one, runs tests, commits, and loops until all criteria pass. Input — Jira ticket ID (e.g., CC-1234). Use when you want Claude to autonomously implement a full card.
---

# Ralph Loop — Implement

Loop autonomo que implementa um card do Jira ate todos os criterios de aceite passarem.

## Input

O usuario fornece o ticket do Jira: `CC-1234` (ou URL completa).

## Setup

Ao receber o comando, IMEDIATAMENTE crie o state file `.claude/ralph-loop.local.md` no diretorio do projeto atual:

```markdown
---
iteration: 1
max_iterations: 10
completion_promise: DONE
task_type: implement
task_input: <TICKET_ID>
---

[Ralph Loop — implement <TICKET_ID>]

Voce esta em um loop autonomo. A cada iteracao:

1. Leia o card do Jira <TICKET_ID> via browser MCP para obter criterios de aceite
   - Se ja leu nesta sessao, use o checklist em .claude/ralph-progress-<TICKET_ID>.md
2. Verifique o progresso atual:
   - git log (commits ja feitos)
   - Leia .claude/ralph-progress-<TICKET_ID>.md (checklist de criterios)
   - Estado atual do codigo
3. Identifique o PROXIMO criterio de aceite nao implementado
4. Implemente APENAS esse criterio (foco em 1 por iteracao)
5. Rode testes: tsc --noEmit + suite de testes do projeto
6. Se testes falharem: corrija antes de prosseguir
7. Commite com conventional commits (ticket no scope): feat(<TICKET_ID>): descricao
8. Atualize .claude/ralph-progress-<TICKET_ID>.md marcando o criterio como feito
9. Se TODOS os criterios estao implementados E testes passam:
   - Abra um PR com gh pr create (link do Jira no body)
   - Output: <promise>DONE</promise>

IMPORTANTE:
- Faca 1 criterio por iteracao — nao tente tudo de uma vez
- Commite apos cada criterio implementado (progresso incremental)
- Se travar em algo, registre no progress file e tente outra abordagem na proxima iteracao
- Use /compact se o contexto ficar pesado
- NUNCA finja que terminou — so output <promise>DONE</promise> quando realmente tudo estiver pronto
```

## Apos criar o state file

1. Crie a branch: `feat/<TICKET_ID>-<descricao-curta>` (se ainda nao existir)
2. Busque o card do Jira via browser MCP
3. Crie o progress file `.claude/ralph-progress-<TICKET_ID>.md` com o checklist de criterios
4. Comece a implementar o primeiro criterio
5. Ao terminar a iteracao, o Stop Hook vai automaticamente re-injetar o prompt
