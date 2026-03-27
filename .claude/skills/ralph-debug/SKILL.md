---
name: ralph-debug
description: Autonomous debugging loop. Receives a bug report, reproduces, investigates root cause, fixes, and adds regression test. Loops with clean context until bug is verified fixed. Input — bug description, issue link, or error log.
---

# Ralph Loop v2 — Debug

Loop autonomo de debugging: reproduz o bug, investiga, corrige, e verifica — com contexto limpo entre iteracoes.

## Input

O usuario fornece:
- Descricao do bug: "login retorna 500 quando email tem acento"
- Link de issue: "https://github.com/org/repo/issues/42"
- Error log: stack trace ou mensagem de erro

## Primeira Iteracao (interativa — VOCE FAZ ISSO AGORA)

### 1. Criar branch
```bash
git checkout -b fix/<descricao-curta>
```

### 2. Coletar informacoes do bug

- Leia a issue/bug report
- Identifique: O que deveria acontecer? O que acontece? Steps to reproduce?
- Procure logs/stack traces relevantes
- Identifique o modulo/arquivo mais provavel

### 3. Criar state files

Crie o diretorio: `.claude/ralph-state/debug-<descricao-slug>/`

**progress.md:**
```markdown
# Progress — Debug: <descricao>

## Etapas
- [ ] Reproduzir o bug (escrever teste que falha)
- [ ] Isolar a causa raiz
- [ ] Implementar o fix
- [ ] Verificar (teste de regressao passa)
- [ ] Verificar que nenhum teste existente quebrou

## Bug Info
- Sintoma: <o que acontece>
- Esperado: <o que deveria acontecer>
- Steps to reproduce: <como reproduzir>
```

**journal.md:**
```markdown
# Ralph Journal — Debug: <descricao>

Task: <descricao do bug>
Tipo: debug
Inicio: <data/hora>

## Hipoteses
(sera preenchido durante a investigacao)
```

**prompt.md:**
```markdown
Voce esta debugando: <descricao do bug>.

## Metodologia Estruturada

### Se o bug NAO foi reproduzido ainda (checar progress.md):
1. Leia o journal.md — veja hipoteses anteriores
2. Escreva um teste que reproduz o bug (deve FALHAR com o comportamento bugado)
3. Se conseguir reproduzir: marque no progress.md, registre no journal
4. Se NAO conseguir: registre a tentativa no journal com detalhes, tente outra abordagem

### Se o bug FOI reproduzido mas causa raiz nao isolada:
1. Leia o journal.md — veja hipoteses ja testadas
2. Formule uma NOVA hipotese (diferente das anteriores)
3. Investigue: adicione logs, leia o codigo, trace o fluxo
4. Registre a hipotese e o resultado no journal
5. Se encontrou a causa raiz: marque no progress.md

### Se a causa raiz esta isolada mas nao corrigida:
1. Implemente o fix
2. Rode o teste de reproducao (deve PASSAR agora)
3. Rode suite completa de testes
4. Commite: fix(<scope>): <descricao>
5. Se testes passam: marque no progress.md

### Se tudo feito:
1. Verifique: teste de regressao existe e passa
2. Verifique: nenhum teste existente quebrou
3. Output: <promise>DONE</promise>

## Regras
- NUNCA adivinhe a causa — reproduza primeiro, investigue depois
- Cada hipotese registrada no journal (testada ou descartada)
- O fix deve ter teste de regressao
- Se travou 3 iteracoes na mesma etapa: questione premissas fundamentais
```

### 4. Comecar a investigacao

Tente reproduzir o bug:
1. Escreva um teste que demonstra o comportamento bugado
2. Se reproduziu → investigue a causa raiz
3. Atualize progress.md e journal.md

### 5. Lancar o runner em background

```bash
node ~/.claude/scripts/ralph-runner.js \
  --task-type debug \
  --task-id "debug-<descricao-slug>" \
  --max-iterations 8 \
  --completion-promise "DONE" \
  --cwd "$(pwd)" &
```
