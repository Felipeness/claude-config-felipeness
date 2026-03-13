---
name: ralph-refactor
description: Autonomous refactoring loop. Applies refactoring steps incrementally, runs tests after each step, commits, and loops until the spec is fully implemented with green tests. Input — refactoring description or spec. Use for large refactorings that need incremental safe steps.
---

# Ralph Loop — Refactor

Loop autonomo que aplica refactoring em passos incrementais, garantindo testes verdes a cada passo.

## Input

O usuario fornece a descricao do refactoring. Pode ser:
- Texto livre: "extrair shared pagination helpers"
- Referencia a um arquivo de spec: "seguir o plano em REFACTOR_PLAN.md"

## Setup

Ao receber o comando, IMEDIATAMENTE crie o state file `.claude/ralph-loop.local.md` no diretorio do projeto atual:

```markdown
---
iteration: 1
max_iterations: 10
completion_promise: DONE
task_type: refactor
task_input: <DESCRICAO_CURTA>
---

[Ralph Loop — refactor: <DESCRICAO>]

Voce esta em um loop autonomo de refactoring. A cada iteracao:

1. Na PRIMEIRA iteracao:
   - Analise o codebase pra entender o estado atual
   - Crie um plano de refactoring em .claude/ralph-refactor-plan.md com passos numerados
   - Cada passo deve ser pequeno o suficiente pra manter testes verdes
   - Comece pelo passo 1

2. Nas iteracoes SEGUINTES:
   - Leia .claude/ralph-refactor-plan.md
   - Identifique o proximo passo nao concluido
   - Aplique o refactoring desse passo
   - Rode testes (tsc --noEmit + suite de testes)
   - Se testes falharem: corrija ANTES de prosseguir (nao va pro proximo passo com testes vermelhos)
   - Commite: refactor(<SCOPE>): descricao do passo
   - Marque o passo como concluido no plan file

3. Quando TODOS os passos estiverem concluidos E testes passam:
   - Faca um review final do codigo refatorado (verificar que nada quebrou)
   - Output: <promise>DONE</promise>

IMPORTANTE:
- 1 passo por iteracao — refactoring seguro e incremental
- NUNCA quebre testes — se um passo quebra algo, corrija na mesma iteracao
- Se o plano precisar mudar (descobriu algo novo), atualize o plan file
- Use a metodologia do skill refactoring (safe, structured)
- NUNCA finja que terminou — so output <promise>DONE</promise> quando o plano estiver 100% feito
```

## Apos criar o state file

1. Crie a branch: `refactor/<descricao-curta>` (se ainda nao existir)
2. Analise o codebase relevante
3. Crie o plano de refactoring com passos claros
4. Comece pelo passo 1
