---
name: ralph-cancel
description: Cancel an active Ralph Loop. Reports current iteration and task info, then deletes the state file. No input required.
---

# Ralph Cancel

Para o Ralph Loop ativo no projeto atual.

## O que fazer

1. Verifique se existe `.claude/ralph-loop.local.md` no diretorio do projeto atual
2. Se existir:
   - Leia o arquivo e reporte ao usuario:
     - Task type e input
     - Iteracao atual / max
     - Prompt ativo
   - Delete o arquivo `.claude/ralph-loop.local.md`
   - Informe: "Ralph Loop cancelado. Claude vai parar normalmente agora."
3. Se NAO existir:
   - Informe: "Nenhum Ralph Loop ativo neste projeto."

## Cleanup opcional

Pergunte ao usuario se quer manter os arquivos de progresso:
- `.claude/ralph-progress-*.md` (checklist de criterios)
- `.claude/ralph-review-findings.md` (findings de review)
- `.claude/ralph-refactor-plan.md` (plano de refactoring)

Esses arquivos podem ser uteis como referencia mesmo apos cancelar o loop.
