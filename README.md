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
└── skills/                   # Skills carregadas sob demanda (14 skills)
    ├── coding-guidelines/    # Padroes de codigo TS/React
    ├── typescript/           # Standards TypeScript/JS
    ├── react/                # Best practices React 19/Next.js
    ├── go/                   # Standards Go idiomatico
    ├── software-engineering/ # Principios core
    ├── planning/             # Planejamento e arquitetura
    ├── api-design/           # REST/webhook API patterns
    ├── observability/        # Logging, tracing, monitoring
    ├── debugging/            # Investigacao estruturada de bugs
    ├── refactoring/          # Refatoracao segura
    ├── review-changes/       # Code review workflow
    ├── reviewing-code/       # PR/commit reviews
    ├── writing/              # Documentacao e commits
    └── copywriting/          # Marketing content
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
| `observability` | Structured logging, tracing, error tracking | Adicionando monitoring a servicos |

### Qualidade

| Skill | Descricao | Quando Usar |
|-------|-----------|-------------|
| `review-changes` | Workflow de code review sistematico | Revisando PRs com checklist |
| `reviewing-code` | Checklist de review rapido | Reviews curtos e objetivos |
| `refactoring` | Refatoracao segura e incremental | Aplicando melhorias pos-review |
| `debugging` | Investigacao estruturada de bugs | Bugs, erros runtime, comportamento inesperado |

### Planejamento e Comunicacao

| Skill | Descricao | Quando Usar |
|-------|-----------|-------------|
| `software-engineering` | Principios core (KISS, YAGNI, etc.) | Decisoes tecnicas e arquiteturais |
| `planning` | Planejamento e arquitetura completa | Novos projetos, escolha de tecnologias |
| `writing` | Documentacao, commits, PRs | Escrita tecnica, README, mensagens |
| `copywriting` | Marketing e vendas | Landing pages, descricoes de produto |

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
| Com skills (14 sob demanda) | ~150 tokens |

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

**Criado por FelipeNess** | **Atualizado em 23/02/2026**

> *"Code is reference, history, and functionality - it must be readable as a journal."*

> *"De um certo ponto adiante nao ha volta. Esse e o ponto que deve ser alcancado."*
> -- Franz Kafka
