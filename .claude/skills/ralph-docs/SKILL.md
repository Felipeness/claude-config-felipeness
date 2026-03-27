---
name: ralph-docs
description: Autonomous documentation loop. Analyzes code, identifies doc gaps, generates/updates documentation, and validates completeness. Loops with clean context until coverage target is met. Input — scope (API docs, README, JSDoc, changelog).
---

# Ralph Loop v2 — Docs

Loop autonomo que analisa codigo, identifica gaps de documentacao, e gera/atualiza docs ate atingir o target.

## Input

O usuario fornece:
- Escopo: "documentar API REST", "atualizar README", "JSDoc para modulo X"
- Target opcional: "100% das funcoes publicas documentadas"
- Formato: "Swagger/OpenAPI", "JSDoc", "Markdown", "TSDoc"

## Primeira Iteracao (interativa — VOCE FAZ ISSO AGORA)

### 1. Criar branch (se aplicavel)
```bash
git checkout -b docs/<descricao-curta>
```

### 2. Auditar documentacao atual

- Leia o codigo fonte do escopo alvo
- Identifique funcoes/endpoints/modulos SEM documentacao
- Identifique docs desatualizados (assinatura mudou, comportamento mudou)
- Conte: total de items documentaveis vs documentados

### 3. Criar state files

Crie o diretorio: `.claude/ralph-state/docs-<descricao-slug>/`

**progress.md:**
```markdown
# Progress — Docs: <descricao>

## Items a Documentar
- [ ] Item 1: <funcao/endpoint/modulo> — <tipo: JSDoc|Swagger|README|etc>
- [ ] Item 2: <funcao/endpoint/modulo>
- [ ] ...

## Items a Atualizar (desatualizados)
- [ ] Item A: <funcao> — doc nao reflete assinatura atual
- [ ] ...

## Coverage
- Target: <N>% (ou N items)
- Atual: X/Y documentados

## Status
- Total: N items
- Feitos: 0
- Pendentes: N
```

**journal.md:**
```markdown
# Ralph Journal — Docs: <descricao>

Task: <descricao>
Tipo: docs
Inicio: <data/hora>
Coverage baseline: X/Y (<N>%)
Coverage target: <N>%
```

**prompt.md:**
```markdown
Voce esta documentando: <descricao>.

## Abordagem

1. Leia progress.md — identifique o proximo item pendente
2. Leia o codigo fonte do item
3. Escreva/atualize a documentacao:
   - **JSDoc/TSDoc**: Descricao, @param, @returns, @throws, @example
   - **Swagger/OpenAPI**: Path, method, params, request body, responses, examples
   - **README**: Secao relevante com exemplos de uso
   - **Markdown docs**: Descricao clara, exemplos, links para codigo
4. Valide: a doc reflete o comportamento real do codigo? (leia a implementacao)
5. Commite: docs(<scope>): document <item>
6. Atualize progress.md e journal.md
7. Se TODOS os items [x] E coverage >= target:
   - Output: <promise>DONE</promise>

## Regras de qualidade
- Docs devem ser UTEIS, nao burocraticos — se o nome da funcao e auto-explicativo, doc pode ser breve
- Sempre incluir @example com uso real
- Swagger: incluir exemplos de request/response completos
- README: focado em "como usar", nao "como funciona internamente"
- Nao documentar implementacao privada (apenas API publica)
- 3-5 items por iteracao (docs sao rapidos comparado a codigo)
```

### 4. Documentar os primeiros items

- Escreva/atualize docs para 3-5 items
- Commite
- Atualize progress.md e journal.md

### 5. Lancar o runner em background

```bash
node ~/.claude/scripts/ralph-runner.js \
  --task-type docs \
  --task-id "docs-<descricao-slug>" \
  --max-iterations 8 \
  --completion-promise "DONE" \
  --cwd "$(pwd)" &
```
