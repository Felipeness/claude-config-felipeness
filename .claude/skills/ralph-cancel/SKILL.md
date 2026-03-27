---
name: ralph-cancel
description: Cancel an active Ralph Loop. Kills the runner process, reports progress from journal, and optionally cleans up state files.
---

# Ralph Cancel v2

Para qualquer Ralph Loop ativo no projeto atual.

## O que fazer

### 1. Verificar loops ativos

Procure por runners ativos em `.claude/ralph-state/`:

```bash
ls .claude/ralph-state/*/runner.pid 2>/dev/null
```

Tambem verifique o legado:
```bash
test -f .claude/ralph-loop.local.md && echo "LEGACY_ACTIVE"
```

### 2. Se encontrar runner(s) ativo(s)

Para cada runner ativo:

1. Leia o `config.json` para obter task type e task id
2. Leia o `journal.md` para resumo do progresso
3. Leia o `progress.md` para status do checklist
4. Mate o processo:
   ```bash
   kill $(cat .claude/ralph-state/<task-id>/runner.pid) 2>/dev/null
   ```
5. Remova o PID file:
   ```bash
   rm .claude/ralph-state/<task-id>/runner.pid
   ```

Reporte ao usuario:
```
Ralph Loop cancelado:
- Task: <type> <id>
- Iteracoes completadas: N
- Progresso: X/Y criterios feitos
- Ultimo journal entry: <resumo>
```

### 3. Se encontrar loop legado

1. Leia `.claude/ralph-loop.local.md` para obter iteracao e task info
2. Delete o arquivo
3. Reporte: "Ralph Loop legado cancelado (iteracao N)"

### 4. Se nenhum loop ativo

Informe: "Nenhum Ralph Loop ativo neste projeto."

### 5. Cleanup opcional

Pergunte ao usuario:
> "Quer manter os state files em `.claude/ralph-state/<id>/` para referencia? (journal, progress, logs)"
> - Se sim: manter tudo exceto runner.pid
> - Se nao: `rm -rf .claude/ralph-state/<id>/`
