---
name: ralph-perf
description: Autonomous performance optimization loop. Benchmarks, identifies bottlenecks, optimizes, and re-benchmarks until performance target is met. Loops with clean context. Input — performance target (e.g., "LCP < 2s", "API < 200ms", "bundle < 500KB").
---

# Ralph Loop v2 — Perf

Loop autonomo de otimizacao de performance: benchmark → identifica bottleneck → otimiza → re-benchmark → repete ate atingir target.

## Input

O usuario fornece:
- Target: "API response < 200ms", "LCP < 2.5s", "bundle < 500KB"
- Escopo: "endpoint /api/users", "pagina de listagem", "build do projeto"
- Ferramenta de benchmark (opcional): "lighthouse", "autocannon", "hyperfine"

## Primeira Iteracao (interativa — VOCE FAZ ISSO AGORA)

### 1. Criar branch
```bash
git checkout -b perf/<descricao-curta>
```

### 2. Benchmark baseline

Rode o benchmark adequado ao tipo de performance:

**API Performance:**
```bash
# Node.js: autocannon ou clinic
npx autocannon -d 10 -c 10 http://localhost:3000/api/endpoint
```

**Frontend Performance:**
```bash
# Lighthouse CLI
npx lighthouse http://localhost:3000 --output json --quiet
```

**Bundle Size:**
```bash
# Analyze bundle
npx next build && npx @next/bundle-analyzer
# ou
npx webpack-bundle-analyzer stats.json
```

**General:**
```bash
# hyperfine para CLI/scripts
hyperfine --warmup 3 'node script.js'
```

Registre os numeros exatos do baseline.

### 3. Criar state files

Crie o diretorio: `.claude/ralph-state/perf-<descricao-slug>/`

**progress.md:**
```markdown
# Progress — Perf: <descricao>

## Target
- Metrica: <nome> (ex: p95 response time)
- Target: <valor> (ex: < 200ms)
- Baseline: <valor medido> (ex: 850ms)
- Gap: <diferenca> (ex: 650ms a reduzir)

## Bottlenecks Identificados
- [ ] Bottleneck 1: <descricao> — impacto estimado: <N>ms/<N>KB
- [ ] Bottleneck 2: <descricao> — impacto estimado: <N>ms/<N>KB
- [ ] ...

## Otimizacoes Aplicadas
(sera preenchido conforme as iteracoes)

## Status
- Baseline: <valor>
- Atual: <valor>
- Target: <valor>
- Atingido: nao
```

**journal.md:**
```markdown
# Ralph Journal — Perf: <descricao>

Task: <descricao>
Tipo: perf
Inicio: <data/hora>
Target: <metrica> < <valor>
Baseline: <valor medido>
Ferramenta: <benchmark usado>
```

**prompt.md:**
```markdown
Voce esta otimizando performance: <descricao>.
Target: <metrica> < <valor alvo>

## Abordagem por iteracao

1. Leia progress.md — veja o estado atual e bottlenecks
2. Leia journal.md — veja o que ja foi tentado e o impacto

### Se bottlenecks NAO identificados ainda:
- Profile o codigo (leia o fonte, identifique hot paths)
- Identifique os top 3 bottlenecks por impacto estimado
- Registre no progress.md
- Comece a otimizar o de maior impacto

### Se bottlenecks identificados:
- Pegue o proximo bottleneck nao resolvido
- Aplique a otimizacao
- Rode o benchmark (MESMO comando do baseline para comparacao justa)
- Registre no journal: antes → depois, o que mudou, impacto real

### Tipos comuns de otimizacao:
- **N+1 queries**: batching, DataLoader, joins
- **Memoria**: streaming, lazy loading, pools
- **Bundle**: tree-shaking, dynamic imports, code splitting
- **Rendering**: memoization, virtualization, SSR/SSG
- **I/O**: caching (Redis), CDN, compression
- **CPU**: algoritmo melhor, worker threads, evitar regex em hot path

3. Se otimizacao MELHOROU: commite perf(<scope>): <o que otimizou>
4. Se otimizacao NAO MELHOROU ou PIOROU:
   - Reverta
   - Registre no journal (tentativa falha — importante para nao repetir)
5. Atualize progress.md com medicao atual
6. Se metrica atual <= target E testes passam:
   - Output: <promise>DONE</promise>

## Regras
- SEMPRE medir antes e depois — nunca assumir que melhorou
- Usar o MESMO benchmark command (comparacao justa)
- Nao sacrificar legibilidade por micro-otimizacoes
- Se uma otimizacao quebra testes: reverta
- Registre cada tentativa no journal (sucesso ou falha)
```

### 4. Identificar e otimizar o primeiro bottleneck

- Profile ou analise o codigo
- Identifique o bottleneck de maior impacto
- Aplique a otimizacao
- Re-benchmark
- Commite se melhorou
- Atualize progress.md e journal.md

### 5. Lancar o runner em background

```bash
node ~/.claude/scripts/ralph-runner.js \
  --task-type perf \
  --task-id "perf-<descricao-slug>" \
  --max-iterations 10 \
  --completion-promise "DONE" \
  --cwd "$(pwd)" &
```
