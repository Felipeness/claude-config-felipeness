# Claude Code Configuration by FelipeNess

> Configuracao profissional para Claude Code com foco em qualidade, type-safety, observabilidade e boas praticas de engenharia de software.

**Autor:** FelipeNess
**Data:** 23 de Fevereiro de 2026
**GitHub:** [github.com/Felipeness](https://github.com/Felipeness)

---

## Sumario

- [Estrutura](#estrutura)
- [Instalacao](#instalacao)
- [Skills](#skills)
- [Commands](#commands)
- [Fluxos de Trabalho](#fluxos-de-trabalho)
- [MCP Servers](#mcp-servers)
- [Permissoes](#permissoes-wildcards)
- [Configuracoes](#configuracoes)
- [Principios de Codigo](#principios-de-codigo)

---

## Estrutura

```
.claude/
├── CLAUDE.md                 # Instrucoes globais (< 150 linhas)
├── CLAUDE-expanded.md        # Versao completa (todas as regras inline)
├── settings.json             # Configuracoes do Claude Code
├── settings.local.json       # Permissoes (wildcards consolidados)
├── play-notification.ps1     # Som ao completar tarefas
├── statusline.ps1            # Status line customizada
├── songs/
│   └── duolingo-correct.mp3  # Notificacao sonora
├── commands/                 # Slash commands customizados
│   ├── new-feat.md           # /new-feat - Criar features
│   ├── create-feature.md     # /create-feature - Feature com branch
│   ├── review.md             # /review - Revisar codigo
│   ├── review-staged.md      # /review-staged - Revisar staged
│   ├── ultrathink-review.md  # /ultrathink-review - Review profundo
│   ├── open-pr.md            # /open-pr - Abrir PR
│   ├── investigate.md        # /investigate - Investigar
│   ├── investigate-batch.md  # /investigate-batch - Investigar (batch)
│   └── trim.md               # /trim - Reduzir PR description
├── skills/                   # Skills customizadas (28 skills)
│   ├── api-design/           # REST/webhook API patterns
│   ├── architecture-patterns/ # CQRS, Event Sourcing, Saga, etc.
│   ├── code-quality/         # CUPID/SOLID/DRY/KISS/YAGNI
│   ├── code-review-comments/ # Tom de code review em PRs
│   ├── codebase-analysis/    # Analise multi-agente de repos
│   ├── coding-guidelines/    # Padroes de codigo TS/React
│   ├── copywriting/          # Marketing content
│   ├── debugging/            # Investigacao estruturada de bugs
│   ├── figma-code-connect/   # Figma Code Connect mappings
│   ├── figma-to-code/        # Pipeline pixel-perfect Figma
│   ├── functional-programming/ # FP, ROP, imutabilidade
│   ├── go/                   # Standards Go idiomatico
│   ├── holonomic-systems/    # SCS, holarchy, Koestler
│   ├── mirror-pr/            # PR espelho master → develop
│   ├── observability/        # Logging, tracing, monitoring
│   ├── planning/             # Planejamento e arquitetura
│   ├── pr-jira-review/       # PR review + Jira cross-ref
│   ├── ralph-cancel/         # Cancelar Ralph Loop
│   ├── ralph-debug/          # Loop autonomo de debug
│   ├── ralph-docs/           # Loop autonomo de docs
│   ├── ralph-implement/      # Loop autonomo Jira → PR
│   ├── ralph-migrate/        # Loop autonomo de migracao
│   ├── ralph-perf/           # Loop autonomo de performance
│   ├── ralph-refactor/       # Loop autonomo de refactoring
│   ├── ralph-review/         # Loop autonomo de PR review
│   ├── ralph-test/           # Loop autonomo TDD
│   ├── react/                # Best practices React 19/Next.js
│   ├── refactoring/          # Refatoracao segura
│   ├── review-changes/       # Code review workflow
│   ├── reviewing-code/       # PR/commit reviews
│   ├── software-engineering/ # Principios core
│   ├── typescript/           # Standards TypeScript/JS
│   ├── ultrathink-review/    # Deep review SOLID/DRY/KISS
│   └── writing/              # Documentacao e commits
├── hooks/                      # Git/CLI hooks (Node-based for Windows-safe spawn)
│   ├── bash-pre-checks.js       # Dangerous cmds + conventional commits + branch naming + AWS profile
│   ├── cleanup-temp-files.sh    # SessionEnd cleanup
│   ├── enforce-design-first.js  # Blocks code edits without a plan in governed projects
│   ├── lint-after-edit.js       # Biome/ESLint on the edited file only (3s cap)
│   ├── mirror-pr-reminder.js    # Reminds to cherry-pick PR to develop on echo-atende repos
│   ├── pipeline-gate.js         # PostToolUse reminder after spec/plan writes
│   ├── pipeline-precheck.js     # Blocks execution skills without audit + phase-gate
│   ├── post-compact-context.sh  # Re-inject context after /compact
│   ├── ralph-stop-hook.js       # Ralph Loop iteration control
│   ├── task-completed-verify.js # Blocks task completion with untracked files / tsc errors
│   ├── task-created-validate.js # Min description length on TaskCreated
│   ├── teammate-idle-check.js   # Keeps teammates working while pending tasks exist
│   ├── typecheck-after-edit.js  # Incremental tsc --noEmit (3s cap, drive-letter safe)
│   └── validate-pr-body.js      # Jira link + conventional title + no defensive phrases
├── rules/
│   └── figma-design-system.md # Regras Figma-to-code
└── teams/
    └── default/inboxes/      # Team configs (t3-implementer, team-lead)
```

---

## Instalacao

### Global (Recomendado)

```bash
# Windows PowerShell
Copy-Item -Recurse ".claude" "$HOME\.claude"

# Linux/Mac
cp -r .claude ~/.claude
```

### Por Projeto

```bash
cp -r .claude /caminho/do/seu/projeto/.claude
```

---

## Skills

Skills sao regras carregadas sob demanda para economizar tokens. O Claude Code carrega automaticamente quando necessario.

### Implementacao

| Skill | Descricao | Quando Usar |
|-------|-----------|-------------|
| `coding-guidelines` | Padroes completos TypeScript/React | Escrevendo qualquer codigo novo |
| `typescript` | Standards TypeScript/JavaScript | Codigo TS/JS especifico |
| `react` | Best practices React 19/Next.js | Componentes, hooks, data fetching |
| `go` | Go idiomatico, concorrencia, error handling | APIs e servicos em Go |
| `api-design` | REST/webhook patterns, validacao, idempotencia | Projetando endpoints, webhooks, contratos |
| `architecture-patterns` | CQRS, Event Sourcing, Saga, Circuit Breaker | Desenhando arquitetura de sistemas |
| `holonomic-systems` | SCS, holarchy, Koestler, Conway's Law | System-of-systems, service boundaries |
| `functional-programming` | FP, ROP, imutabilidade, composicao | Regras de negocio, pipelines de dados |
| `code-quality` | CUPID/SOLID/DRY/KISS/YAGNI completo | Escrevendo ou revisando qualquer codigo |
| `observability` | Structured logging, tracing, error tracking | Adicionando monitoring a servicos |
| `figma-to-code` | Pipeline pixel-perfect Figma → codigo | Implementando designs do Figma |
| `figma-code-connect` | Figma Code Connect (.figma.tsx) | Mapeando componentes Figma → codebase |

### Qualidade

| Skill | Descricao | Quando Usar |
|-------|-----------|-------------|
| `review-changes` | Workflow de code review sistematico | Revisando PRs com checklist |
| `reviewing-code` | Checklist de review rapido | Reviews curtos e objetivos |
| `ultrathink-review` | Deep review SOLID/DRY/KISS/YAGNI/CUPID | PRs criticas ou complexas |
| `pr-jira-review` | PR review + Jira cross-reference | PRs com card Jira associado |
| `code-review-comments` | Tom e vocabulario de review | Escrevendo comentarios em PRs |
| `codebase-analysis` | Analise multi-agente de repositorio | Auditoria completa de codebase |
| `refactoring` | Refatoracao segura e incremental | Aplicando melhorias pos-review |
| `debugging` | Investigacao estruturada de bugs | Bugs, erros runtime, comportamento inesperado |
| `mirror-pr` | PR espelho master → develop | Repos com dual-branch (echo-atende) |

### Ralph Loops (Agentes Autonomos)

| Skill | Descricao | Quando Usar |
|-------|-----------|-------------|
| `ralph-implement` | Jira card → implementacao → PR | Implementar card completo |
| `ralph-review` | PR review autonomo com fix loop | Review e correcao automatica |
| `ralph-refactor` | Refactoring incremental com testes | Refatoracao autonoma |
| `ralph-test` | TDD loop: testes primeiro | Desenvolvimento test-first |
| `ralph-debug` | Debug autonomo: reproduzir → fix → regressao | Investigar e corrigir bugs |
| `ralph-docs` | Gerar/atualizar documentacao | Cobertura de docs |
| `ralph-migrate` | Migracoes incrementais com rollback | DB, API, framework, lib |
| `ralph-perf` | Benchmark → otimizar → re-benchmark | Performance targets |
| `ralph-cancel` | Cancelar loop ativo | Parar qualquer Ralph Loop |

### Planejamento e Comunicacao

| Skill | Descricao | Quando Usar |
|-------|-----------|-------------|
| `software-engineering` | Principios core (KISS, YAGNI, etc.) | Decisoes tecnicas e arquiteturais |
| `planning` | Planejamento e arquitetura completa | Novos projetos, escolha de tecnologias |
| `writing` | Documentacao, commits, PRs | Escrita tecnica, README, mensagens |
| `copywriting` | Marketing e vendas | Landing pages, descricoes de produto |

---

## Plugins Instalados

Alem das skills customizadas acima, este setup usa **14 plugins oficiais** (`claude-plugins-official`) que adicionam skills, commands, agents e LSP integrations automaticamente. Plugins sao gerenciados pelo Claude Code e atualizados automaticamente — **nao estao neste repo** pois sao instalados via `claude plugins install`.

### Para instalar todos os plugins

```bash
claude plugins install superpowers
claude plugins install frontend-design
claude plugins install commit-commands
claude plugins install pr-review-toolkit
claude plugins install feature-dev
claude plugins install hookify
claude plugins install playground
claude plugins install skill-creator
claude plugins install claude-code-setup
claude plugins install claude-md-management
claude plugins install security-guidance
claude plugins install typescript-lsp
claude plugins install gopls-lsp
claude plugins install pyright-lsp
```

### Skills de plugins (nao incluidas neste repo)

| Plugin | Skills/Commands | Descricao |
|--------|----------------|-----------|
| **superpowers** v5.0.6 | `brainstorming`, `writing-plans`, `executing-plans`, `verification-before-completion`, `test-driven-development`, `systematic-debugging`, `receiving-code-review`, `requesting-code-review`, `using-git-worktrees`, `subagent-driven-development`, `finishing-a-development-branch`, `dispatching-parallel-agents`, `writing-skills` | Framework completo de workflow — brainstorm, planos, TDD, debug, worktrees, code review |
| **frontend-design** | `frontend-design` | UI/UX design com alta qualidade visual, evita estetica generica de AI |
| **commit-commands** | `/commit`, `/commit-push-pr`, `/clean_gone` | Git commit, push+PR, limpar branches gone |
| **pr-review-toolkit** | `/review-pr`, agents: `code-reviewer`, `code-simplifier`, `comment-analyzer`, `pr-test-analyzer`, `type-design-analyzer`, `silent-failure-hunter` | Suite completa de review com 6 agentes especializados |
| **feature-dev** | `feature-dev`, agents: `code-explorer`, `code-architect`, `code-reviewer` | Desenvolvimento guiado de features com agentes de exploracao e arquitetura |
| **hookify** | `/hookify`, `/hookify help`, `/hookify configure`, `/hookify list`, `writing-rules` | Criar hooks para prevenir comportamentos indesejados |
| **playground** | `playground` | Criar playgrounds HTML interativos single-file |
| **skill-creator** | `skill-creator` | Criar, modificar e testar skills com evals |
| **claude-code-setup** | `claude-automation-recommender` | Analisa codebase e recomenda automacoes |
| **claude-md-management** | `claude-md-improver`, `/revise-claude-md` | Auditar e melhorar CLAUDE.md |
| **security-guidance** | *(security rules)* | Orientacoes de seguranca automaticas |

### LSP Plugins (Language Server Protocol)

| Plugin | Linguagem | Funcionalidade |
|--------|-----------|----------------|
| **typescript-lsp** | TypeScript/JavaScript | Autocomplete, go-to-definition, diagnostics |
| **gopls-lsp** | Go | Autocomplete, type checking, diagnostics |
| **pyright-lsp** | Python | Type checking, diagnostics |

### Nota sobre `defuddle`

A skill `defuddle` e instalada como symlink via plugin e extrai markdown limpo de paginas web. Nao esta neste repo por ser um link simbolico gerenciado pelo plugin.

---

### Como as skills se conectam

```
Planejar       →  planning + api-design
Implementar    →  coding-guidelines + typescript/react/go
Observar       →  observability (logs, tracing, metrics)
Debugar        →  debugging (quando algo quebra)
Revisar        →  review-changes ou ultrathink-review
Refatorar      →  refactoring (aplica as melhorias do review)
Publicar       →  writing + open-pr
```

---

## Commands

| Command | Descricao | Uso |
|---------|-----------|-----|
| `/investigate` | Investiga antes de planejar | `/investigate auth flow` |
| `/investigate-batch` | Investiga com perguntas em batch (max 5) | `/investigate-batch auth flow` |
| `/new-feat` | Planeja + implementa feature | `/new-feat Add user auth` |
| `/create-feature` | Branch + implementacao + QA checks | `/create-feature Add OAuth` |
| `/review` | Revisa alteracoes contra guidelines | `/review` |
| `/review-staged` | Revisa apenas alteracoes staged | `/review-staged` |
| `/ultrathink-review` | Review profundo SOLID/DRY/KISS/YAGNI/CUPID | `/ultrathink-review` |
| `/open-pr` | Cria PR com summary e test plan | `/open-pr Add OAuth` |
| `/trim` | Reduz PR description em 70% | `/trim` |
| `/fp-audit` | Audita codigo por violacoes de FP | `/fp-audit` |

---

## Fluxos de Trabalho

### Fluxo 1: Feature nova (do zero)

**Quando**: Precisa implementar algo novo (endpoint, componente, servico).

```
1. Plan Mode (Shift+Tab)
   → Claude analisa o codebase e propoe um plano
   → Voce aprova, ajusta ou recusa

2. /investigate [feature]
   → Faz perguntas focadas antes de codar
   → Mapeia dependencias e pontos de integracao

3. /create-feature [descricao]
   → Cria branch automaticamente (feat/nome)
   → Implementa seguindo guidelines
   → Roda QA checks automaticos

4. /ultrathink-review
   → Review profundo (SOLID, DRY, KISS, YAGNI, CUPID)
   → Identifica problemas e sugere melhorias

5. Aplique as melhorias sugeridas
   → Claude usa a skill 'refactoring' para aplicar com seguranca

6. /open-pr [titulo]
   → Cria PR com summary e test plan
   → /trim se a descricao ficou grande
```

**Skills envolvidas**: `planning` → `api-design`/`coding-guidelines` → `refactoring` → `writing`

---

### Fluxo 2: Code review de uma PR separada

**Quando**: Alguem abriu uma PR e voce precisa revisar o codigo.

```
1. Abra o projeto no terminal

2. Faca checkout da branch da PR
   → git fetch origin && git checkout nome-da-branch

3. /review
   → Review completo contra todas as guidelines
   → Retorna: Critical, Major, Minor issues + Approval status

   OU

   /ultrathink-review
   → Review profundo com SOLID, DRY, KISS, YAGNI, CUPID
   → Retorna: codigo otimizado + resumo tecnico + perguntas ao autor

4. Copie o output e cole como comentario na PR
```

**Skills envolvidas**: `review-changes` ou `reviewing-code`

**Dica**: Use `/review` para reviews rapidos do dia-a-dia. Use `/ultrathink-review` para PRs criticas ou complexas.

---

### Fluxo 3: Bug fix

**Quando**: Algo quebrou e precisa investigar e corrigir.

```
1. Plan Mode (Shift+Tab)
   → Descreva o bug (comportamento esperado vs real)

2. Claude investiga usando skill 'debugging'
   → Reproduz o bug
   → Isola a camada (API, DB, frontend, network)
   → Busca root cause (nao sintoma)

3. Se for frontend, use MCP tools:
   → Playwright ou Chrome para inspecionar console/network/DOM
   → Screenshots para capturar estado visual

4. Claude escreve teste que FALHA (reproduz o bug)

5. Claude implementa o fix

6. Teste passa → bug corrigido com garantia de nao-regressao

7. /review-staged
   → Revisa apenas as mudancas staged antes de commitar
```

**Skills envolvidas**: `debugging` → `coding-guidelines` → `review-changes`

**Regra**: Sempre escreva um teste para o bug ANTES de corrigir. Voce nunca vai ter que corrigir o mesmo bug duas vezes.

---

### Fluxo 4: Refactoring / Tech debt

**Quando**: Codigo funciona mas precisa melhorar (pos-review, limpeza, simplificacao).

```
1. /ultrathink-review
   → Identifica todos os problemas no codigo atual
   → Prioriza: Critical → High → Medium → Low

2. Claude aplica melhorias usando skill 'refactoring'
   → Um refactoring por commit
   → Roda testes apos cada mudanca
   → Nunca muda comportamento (so estrutura)

3. /review-staged
   → Verifica se o refactoring esta limpo

4. Commit com mensagem clara
   → refactor: extract webhook signature verification
   → refactor: flatten nested conditionals in payment handler
```

**Skills envolvidas**: `reviewing-code` → `refactoring` → `review-changes`

**Regra**: Nao refatore durante feature work. Commits separados. Se nao tem testes, escreva testes primeiro.

---

### Fluxo 5: Projetar API / Webhook

**Quando**: Precisa desenhar endpoints, contratos entre servicos, ou webhook handlers.

```
1. Plan Mode (Shift+Tab)
   → Descreva o dominio e os requisitos

2. /investigate [api/webhook]
   → Mapeia servicos envolvidos
   → Identifica contratos existentes

3. Claude usa skill 'api-design' para projetar:
   → URL structure (nouns, plural, kebab-case)
   → Request/response types (Zod validation)
   → Error format padronizado
   → Webhook: signature verification, idempotency, retry logic
   → Correlation IDs para tracing entre servicos

4. Claude usa skill 'observability' para adicionar:
   → Structured logging nos endpoints
   → Health checks
   → Metricas de latencia e error rate

5. Implementacao + testes + PR
```

**Skills envolvidas**: `planning` → `api-design` → `observability` → `coding-guidelines`

---

### Fluxo 6: Adicionar observabilidade a servico existente

**Quando**: Servico em producao sem monitoring adequado.

```
1. /investigate [servico]
   → O que ja tem de logging/monitoring?
   → Quais sao os pontos criticos?

2. Claude usa skill 'observability' para adicionar:
   → Structured logging (JSON, levels corretos)
   → Correlation IDs em todas as requests
   → Error tracking (Sentry/Rollbar)
   → Health check endpoints (/health, /health/detailed)
   → Higher Order Functions para timing automatico
   → Metricas de negocio (pagamentos, webhooks, etc.)

3. /review → /open-pr
```

**Skills envolvidas**: `observability` → `api-design` → `review-changes`

---

### Fluxo 7: Projeto novo (do zero)

**Quando**: Comecando um projeto ou microservico novo.

```
1. Plan Mode (Shift+Tab)
   → Descreva o problema, usuarios, constraints

2. Claude usa skill 'planning' para:
   → Definir success criteria
   → Escolher tech stack (com justificativa)
   → Desenhar arquitetura (KISS, YAGNI)
   → Planejar file structure
   → Definir testing strategy
   → Planejar observabilidade e seguranca

3. /create-feature [setup inicial]
   → Scaffolding do projeto
   → Configs, CI/CD, linting, pre-commit hooks

4. Iterar com fluxos 1-6 conforme necessario
```

**Skills envolvidas**: `planning` → `api-design` → `observability` → `coding-guidelines`

---

### Fluxo 8: Tarefa simples (typo, ajuste rapido)

**Quando**: Mudanca trivial que nao precisa de planejamento.

```
Implementa direto → Commita → Pronto
(sem plan mode, sem review, sem PR)
```

**Regra**: Se cabe em 1-3 linhas e voce tem certeza do que esta fazendo, nao precisa de fluxo.

---

### Resumo dos fluxos

| Situacao | Fluxo | Commands |
|----------|-------|----------|
| Feature nova | Fluxo 1 | `/investigate` → `/create-feature` → `/ultrathink-review` → `/open-pr` |
| Review de PR | Fluxo 2 | `/review` ou `/ultrathink-review` |
| Bug fix | Fluxo 3 | Plan Mode → debug → test → fix → `/review-staged` |
| Refactoring | Fluxo 4 | `/ultrathink-review` → refactor → `/review-staged` |
| API/Webhook design | Fluxo 5 | `/investigate` → Plan Mode → implement → `/open-pr` |
| Observabilidade | Fluxo 6 | `/investigate` → implement → `/review` → `/open-pr` |
| Projeto novo | Fluxo 7 | Plan Mode → `/create-feature` → iterate |
| Tarefa simples | Fluxo 8 | Implementa direto |

---

### Dicas Gerais

- **Plan Mode primeiro**: Sempre comece tarefas nao-triviais em plan mode (Shift+Tab)
- **50% Context**: Use `/compact` antes de atingir 50% do context window
- **Subtasks**: Quebre tarefas para caber em 50% do context window
- **Git Worktrees**: Trabalhe em multiplas features simultaneamente
- **Staged vs Unstaged**: Deixe implementacao em staged e melhorias em unstaged para comparar
- **Vanilla > Complexo**: Claude Code com tarefas bem definidas supera workflows fragmentados
- **Economize contexto**: Nao use Claude como terminal, copie apenas erros relevantes
- **Commit imediato**: Commite assim que completar uma tarefa (nao acumule)

---

## MCP Servers

| Server | Pacote | Uso |
|--------|--------|-----|
| **Context7** | `@upstash/context7-mcp` | Docs atualizadas de bibliotecas (evita alucinacoes de API) |
| **DeepWiki** | `mcp-deepwiki` | Wiki estruturada de repos GitHub (arquitetura, APIs) |
| **Playwright** | `@playwright/mcp` | Automacao de browser, screenshots, testes visuais |
| **Claude in Chrome** | Extension | Debug console/network/DOM em Chrome real |

### Estrategia MCP

```
Research (Context7/DeepWiki) → Debug (Playwright/Chrome) → Document (Excalidraw)
```

> Nao exagere: 4 MCPs diarios e mais efetivo que 15.

### Quando usar cada MCP

| Necessidade | MCP |
|-------------|-----|
| Docs de uma biblioteca (React Query, Zod, etc.) | Context7 |
| Entender arquitetura de repo externo | DeepWiki |
| Testar UI, capturar screenshots | Playwright |
| Debug console errors, network, DOM | Claude in Chrome |

---

## Permissoes (Wildcards)

Consolidadas de ~130 entradas para ~47 usando wildcards:

```json
"Bash(git:*)",    // cobre git add, commit, push, reset, etc.
"Bash(gh:*)",     // cobre gh pr, gh repo, gh api, etc.
"Bash(npm:*)",    // cobre npm install, npm run, etc.
"Bash(pnpm:*)",   // cobre pnpm install, pnpm run, etc.
"Bash(claude:*)", // cobre claude mcp, claude config, etc.
"Bash(start:*)",  // cobre todos os start commands
```

---

## Configuracoes

### settings.json

```json
{
  "includeCoAuthoredBy": false,
  "alwaysThinkingEnabled": true,
  "includeLineNumbers": true,
  "autoSave": true,
  "preferShorterResponses": false,
  "includeFileContext": true
}
```

### Scripts

| Script | Descricao |
|--------|-----------|
| `play-notification.ps1` | Toca som (duolingo-correct.mp3) ao completar tarefas |
| `statusline.ps1` | Status line: `dir branch* \| model exit_code time` |

### Hooks

- **Notification**: Executa `play-notification.ps1` ao finalizar tarefas
- **Status Line**: Mostra dir, branch, model e tempo de execucao

---

## Principios de Codigo

### Type Safety
- Nunca use `any`
- Quase nunca use `as`
- E2E type-safety (API → Database → UI)
- Use query-builders (nao SQL puro)

### Clareza
- Nomes descritivos (sem abreviacoes)
- Early returns (codigo flat)
- Sem magic strings/numbers
- `camelCase` funcoes, `kebab-case` arquivos, `SNAKE_CAPS` constantes

### React
- Componentes puros (nao declare constantes dentro)
- React Query para data fetching (nao useEffect)
- Suspense + Error Boundaries
- Cache keys com enums (nao strings)

### Go
- Explicit over implicit
- Errors are values (sempre trate com `if err != nil`)
- Accept interfaces, return structs
- Small interfaces (1-3 methods)

### Engenharia de Software
- KISS (Keep It Simple)
- YAGNI (You Aren't Gonna Need It)
- Testes de comportamento (nao implementacao)
- Observabilidade e monitoring

---

## Code Review Ultrathink

O command `/ultrathink-review` implementa um review profundo baseado em:

### Principios Analisados

| Principio | Descricao |
|-----------|-----------|
| **SOLID** | Single Responsibility, Open/Closed, Liskov, Interface Segregation, Dependency Inversion |
| **DRY** | Don't Repeat Yourself (3+ ocorrencias = abstrair) |
| **KISS** | Keep It Simple, Stupid (um junior entende em 5 min?) |
| **YAGNI** | You Aren't Gonna Need It (sem future-proofing) |
| **CUPID** | Composable, Unix Philosophy, Predictable, Idiomatic, Domain-based |

### Verificacoes Adicionais

- **Defensive Programming**: Validacao de inputs, edge cases, null/undefined
- **Early Return**: Max 2 niveis de aninhamento
- **Short-Circuit**: Operacoes caras por ultimo
- **Funcoes**: < 20 linhas, max 3 parametros

### Ciclo Review → Refactoring

```
/ultrathink-review          →  Identifica problemas
skill 'refactoring'         →  Guia como corrigir
/review-staged              →  Verifica se ficou limpo
commit                      →  Um refactoring por commit
```

---

## Economizando Tokens

| Abordagem | Tokens |
|-----------|--------|
| Sem skills (tudo no CLAUDE.md) | ~1000 tokens |
| Com skills (28 customizadas + plugins sob demanda) | ~150 tokens |

**Economia:** ~85% de tokens por sessao

---

## Referencias

- **Claude Code Best Practices:** [github.com/shanraisshan/claude-code-best-practice](https://github.com/shanraisshan/claude-code-best-practice)
- **Claude Code in Action (Curso):** [anthropic.skilljar.com/claude-code-in-action](https://anthropic.skilljar.com/claude-code-in-action)
- **Claude Code Docs:** [docs.anthropic.com](https://docs.anthropic.com)
- **OWASP Top 10:** [owasp.org](https://owasp.org)
- **WCAG 2.0:** [w3.org/WAI/WCAG21/quickref](https://www.w3.org/WAI/WCAG21/quickref)

---

## Licenca

MIT License - Use e modifique livremente.

---

**Criado por FelipeNess** | **Atualizado em 27/03/2026**

> *"Code is reference, history, and functionality - it must be readable as a journal."*

> *"De um certo ponto adiante nao ha volta. Esse e o ponto que deve ser alcancado."*
> -- Franz Kafka
