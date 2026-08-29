## Git Workflow
- Do not include "Claude Code" in commit messages
- Commit immediately upon task completion (override: sempre commitar sem pedir quando a task esta completa)
- **PR merge order (master + develop)**: resolve conflicts with `master` first, then create a branch from the resolved one targeting `develop`. Avoids double conflict resolution.

### Branch naming
- Com Jira: `type/TICKET-short-description` (ex: `feat/CC-1234-gamification-scoring`)
- Sem Jira: `type/short-description` (ex: `fix/null-user-payment`)
- Types validos: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `perf`, `ci`

### Conventional commits (enforced by hook)
Formato: `type(scope): descricao em minuscula`

- **Com Jira ticket** (obrigatorio se a branch tem ticket):
  - `feat(CC-1234): add gamification scoring`
  - `fix(CC-1234): handle null user in payment flow`
- **Sem Jira ticket** (chores, docs, infra sem card):
  - `chore: update dependencies`
  - `docs: add API usage examples`
- **Regras**:
  - Tipo deve ser: `feat|fix|chore|refactor|docs|test|style|perf|ci|build|revert`
  - Descricao comeca com letra minuscula
  - Primeira linha max 72 caracteres
  - Se a branch contem ticket (ex: `feat/CC-1234-...`), o commit DEVE referenciar o ticket no scope
  - `feat` = funcionalidade nova, `fix` = correcao de bug, `chore` = tarefas sem impacto funcional (delete, config, deps), `refactor` = reestruturacao sem mudar comportamento
  - Nunca usar `feat` pra deletar coisas — use `chore` ou `refactor`

### PR description
- Sempre incluir link do Jira no body: `Jira: https://superlogica.atlassian.net/browse/CC-XXXX`
- Se nao houver card, explicitar: `Jira: N/A (chore/infra)`
- Titulo do PR segue o mesmo formato do commit principal

## PR Reviews
- Responder code reviews **inline** em cada comentário individual, não em um comentário único consolidado
- Tom: educado, gentil, humano - como colega de equipe respondendo naturalmente
- Responder de forma dividida onde cada ponto foi levantado separadamente
- Referenciar commits pelo **nome/mensagem** (ex: "resolvi no commit `fix: add error guards`"), nunca pelo hash (ex: ~~`85b4632`~~) — humanos não falam em hashes

## Workflow
- Start non-trivial tasks in plan mode
- Break subtasks small enough to complete within 50% context window
- Use `/compact` proactively before hitting 50% context usage
- Use git worktrees for parallel development branches when beneficial
- Vanilla Claude Code with well-defined tasks outperforms complex fragmented workflows
- MCP strategy: Research (Context7/DeepWiki) → Debug (Playwright/Chrome) → Document (Excalidraw)

## Superpowers Integration

Superpowers (brainstorming, writing-plans, subagent-driven-development) é o motor de processo.
Skills customizadas (typescript, nestjs, code-quality, ralph-*) são domínio e implementação.
Não competem — se complementam.

### Calibração por complexidade (enforced by hook)

| Complexidade | Workflow | Exemplo |
|---|---|---|
| **Trivial** (< 5 min) | Direto, sem ceremony | fix typo, update config, one-liner |
| **Simples** (5-30 min) | Plan mode + skill de domínio | bug fix pontual, small refactor |
| **Moderada** (30min-2h) | brainstorming → writing-plans → execution | nova feature, migration |
| **Complexa** (2h+) | Full pipeline com gates | sistema novo, redesign, multi-service |

### Routing: processo vs domínio

**Processo (superpowers — QUANDO e COMO):**
- `brainstorming` → definir O QUE construir
- `writing-plans` → quebrar em tasks executáveis
- `subagent-driven-development` → executar o plano
- `verification-before-completion` → confirmar que funciona
- `finishing-a-development-branch` → decidir merge/PR

**Domínio (custom skills — O QUE aplicar):**
- Código: `typescript` | `go` | `react` | `nestjs` | `functional-programming`
- Qualidade: `code-quality` | `ultrathink-review` | `refactoring`
- Arquitetura: `architecture-patterns` | `holonomic-systems` | `api-design`
- Revisão: `pr-jira-review` | `code-review-comments`
- Loops autônomos: `ralph-*` (já incluem planning interno)

### Preferência quando há overlap
- Debugging: `ralph-debug` > `systematic-debugging` (Ralph é autônomo, loopa até resolver)
- TDD: `ralph-test` > `test-driven-development` (Ralph loopa até cobertura)
- Code review: `ultrathink-review` + `pr-jira-review` > `requesting-code-review` (mais profundo, com Jira)
- Planning: `brainstorming` + `writing-plans` = usar sempre para features moderadas+ (são o core do pipeline)

### Regra do dispatcher
- Perguntas factuais, Q&A, conversas casuais → responder direto, sem invocar skills
- Tasks de implementação → calibrar pela tabela de complexidade acima
- Ralph loops → já encapsulam o processo, não precisam de brainstorming externo
- Nunca invocar skill "por precaução" em tasks triviais — overhead > benefício
- **`code-quality` é OBRIGATÓRIA em toda implementação que vira commit ou PR** (incluindo briefs de agentes), sem o usuário pedir. Seus princípios prevalecem sobre precedente local em código NOVO: "seguir o vizinho" vale para formatação e idioma, nunca para princípio (estado global mutável, CQS, erros engolidos, aninhamento). Conflito entre princípio e precedente → aplicar o princípio e sinalizar o conflito, nunca resolver em silêncio pró-precedente

## Roteamento de modelos para subagentes (economia de cota)

Default configurado: subagente sem `model` explícito roda **Sonnet 5** (via `CLAUDE_CODE_SUBAGENT_MODEL`). Ao despachar qualquer agente (Agent tool, teams, loops ralph, workflows), escolher o `model` pelo custo real da tarefa — nunca deixar herdar Opus/Fable por omissão:

- **`haiku`** — mecânico e sem julgamento: commit/push, mover ou renomear arquivo, rodar comando e reportar output, checagem de status, formatação
- **`sonnet`** (default — basta omitir `model`) — trabalho padrão: exploração de código, implementação de task bem definida, testes, docs, review de diff pequeno
- **`opus`** — complexo: debugging difícil, refactor multi-arquivo, review profundo, design de uma feature
- **`fable`** — só quando raciocínio é o gargalo: arquitetura de sistema, problema em que o opus falhou, auditoria crítica
- **Escalar, não começar caro**: se o agente barato falhar ou devolver resultado fraco, re-despachar a mesma task um tier acima — sai mais barato que abrir no caro
- Forks herdam o modelo principal e não dá pra baratear — preferir agente fresh com prompt bem especificado quando a task não precisa do contexto inteiro da conversa

## Preferências de código (agnóstico de linguagem — TS, Go, Python)

### Meta-regra
- Toda regra neste documento e uma heuristica, nao uma lei. Se seguir a regra cria mais complexidade do que viola-la, documente o motivo e siga em frente
- Severidade: **Hard** (nunca quebrar: no `any`, no erros engolidos, timeout em chamadas externas) > **Strong** (quebrar com justificativa: funcoes < 20 linhas, early return, composition > inheritance) > **Soft** (time discretion: naming conventions, test naming)

### Carga cognitiva e legibilidade
- Priorize redução de carga cognitiva em toda decisão de código
- Código lê de cima para baixo como um jornal — manchetes (funções) → detalhes (implementação)
- Um nível de abstração por função — não misture alto e baixo nível
- Conciso ≠ curto — cada linha tem propósito, sem gordura, mas sem ser críptico
- Condições positivas > dupla negação — `isActive` > `!isNotActive`
- Extrair condições complexas (3+ operandos) para predicados nomeados
- Declarar variáveis perto do uso — minimizar "distância mental"
- Nomes descritivos > comentários — `retryAfterMs` > `timeout`, `userPayments` > `data`
- Comentários só para WHY, nunca WHAT — se precisa explicar o quê, renomeie
- Deep modules > shallow modules — interfaces simples que escondem complexidade, não dezenas de módulos triviais
- Colocation — código relacionado junto (teste, tipo, lógica) por feature, não por camada técnica
- Tell don't ask — `order.shippingCity()` > `order.getCustomer().getAddress().getCity()`

### Controle de fluxo
- Early return + guard clauses > if/else aninhado — happy path no final, indentação mínima
- Nesting max 2 níveis — extrair função no 3º
- Hash maps/strategy maps > switch/if-else chains — extensível, testável
- Operações baratas primeiro, caras por último em condições
- Bounded parallelism (`p-limit` em TS, buffered channels em Go) — nunca `Promise.all` com N ilimitado
- Cancellation signals em operações longas: `AbortController` (Node), `context.Context` (Go)

### Tipos e segurança
- Tipos fortes sempre — nunca `any` (TS), nunca `interface{}` sem necessidade (Go), type hints (Python)
- Discriminated unions > boolean flags — estados impossíveis devem ser irrepresentáveis
- Branded/newtype para evitar primitive obsession (`UserId` ≠ `PostId`)
- Validar na boundary (Zod/schemas/pydantic), confiar internamente — parse don't validate
- Funções totais — tipo de retorno reflete todos os casos possíveis, sem `!` ou acesso não-checado
- Exhaustive matching — usar `never` assertion ou ts-pattern `.exhaustive()` em switches de unions
- `as const` objects > TypeScript enums — menor bundle, tree-shakeable, sem surpresas de reverse mapping
- Timeouts e retry limits explícitos em toda chamada externa — nunca confiar em defaults de libs
- Cache keys nomeados pela query que substituem, não pela entidade — TTL curto para dados voláteis, longo para reference data, indefinido com invalidação explícita para aggregates

### Paradigma e estrutura
- Composição > herança — exceto Liskov genuíno ou exigência de framework (NestJS guards, extends Error)
- Funções puras para regras de negócio, side effects isolados nas bordas (Functional Core / Imperative Shell)
- Imutabilidade por padrão — `const`/`readonly` (TS), values (Go), frozen/tuple (Python)
- CQS: query OU command, nunca ambos — funções que leem não alteram estado (exceto operações atômicas: `pop`, `getOrCreate`, `compareAndSwap` onde separação criaria race conditions)
- Declarativo > imperativo — diga O QUE, não COMO (`.map/.filter` > `for` loops)
- Idempotência em operações de escrita — SET > INCREMENT, idempotency keys

### Organização
- Funções < 20 linhas, max 3 parâmetros (usar struct/objeto se mais) (heurística — strategy maps, state machines e test setup podem exceder se o nível de abstração continua uniforme)
- Código deve gritar o domínio, não o framework (Screaming Architecture)
- Erros com contexto da operação sem "failed to" redundante — `"create user: %w"` > `"failed to create user: failed to insert: failed to..."`
- Named exports > default exports (TS), exported types claros (Go) (exceto Next.js pages/layouts que exigem default)
- Result/Either pattern para erros esperados do negócio, exceptions para erros do sistema
- Import direto do arquivo fonte > barrel files (index.ts) — tree-shaking, sem circular deps (exceto boundary pública de um pacote/lib onde o barrel file É a API surface)
- Table-driven tests para variações de input/output — elimina copy-paste de test functions
- Log levels como contrato: ERROR = pages alguém, WARN = investigar eventualmente, INFO = evento de negócio, DEBUG = contexto dev. JSON structured com `requestId`, `userId`, `operation`, `durationMs`. Nunca logar PII, tokens, ou passwords

## Anti-patterns comuns (evitar sempre)

### Abstração e escopo
- Não criar abstrações prematuras (helpers, utils, wrappers) para coisas usadas 1x — 3 linhas repetidas é melhor que 1 abstração desnecessária
- Não expandir escopo além do pedido — corrigir 1 bug não é desculpa para refatorar 3 módulos não-relacionados
- Não adicionar features, validações ou configurabilidade que não foram pedidas
- Não criar arquivos novos quando editar um existente resolve

### Tipos e segurança
- Não usar `as` para forçar tipos — escrever narrowing/type guard adequado
- Não usar `!` (non-null assertion) — tratar o caso undefined explicitamente
- Não usar strings onde union types/enums/branded types servem — evitar stringly-typed APIs
- Não espalhar `req.body` direto em operações de banco — allowlist de campos explícita (mass assignment)

### Erros e resiliência
- Não envolver tudo em try/catch genérico — tratar erros específicos nas boundaries
- Não engolir erros silenciosamente — `catch {}` vazio é proibido, sempre logar ou propagar
- Não over-engineer error handling para cenários que não podem acontecer
- Não fazer queries sem LIMIT/paginação — `SELECT *` sem limite é bomba em produção

### Performance e concorrência
- Não fazer N+1 queries — buscar em batch, não em loop
- Não fazer `await` sequencial quando operações são independentes — usar `Promise.all`/`errgroup`
- Não usar estado global mutável — cria acoplamento oculto e race conditions
- Não disparar goroutines/promises fire-and-forget sem error handling e cleanup

### Código e estilo
- Não adicionar docstrings, comments ou type annotations em código que não foi alterado
- Não ignorar patterns já existentes no codebase — ler código existente antes de criar novo
- Não duplicar lógica em múltiplos arquivos — grep antes de criar, reutilizar o que existe
- Não usar "should" em nomes de teste — usar verbos em 3ª pessoa
- Não deprecar — substituir. Remover código antigo completamente
- Não deixar código comentado — deletar (git é o histórico)
- Não criar interface 1:1 por classe para "testabilidade" — SOLID sem dogma
- Não usar APIs/libs deprecated do training data — verificar versão atual antes de sugerir

## Testing Strategy
- Test naming: verbo 3a pessoa descrevendo comportamento, sem "should" — `createsUserWithValidEmail`, `rejectsInvalidPayment`
- Test location: colocado junto ao source (`.test.ts` ao lado do `.ts`), não em `__tests__/`
- Mocking philosophy: mock o que não controla (APIs externas, clocks), fake o que controla (repos com in-memory impl). Nunca mock o que está testando
- Table-driven tests para variações de input/output — elimina copy-paste
- Integration > Unit para serviços. Unit só para funções puras com lógica de negócio complexa
- Property-based testing (`@fast-check/vitest`) para invariantes de negócio (financial calcs, serialization roundtrips)
- Testcontainers para DB real em tests de integração — zero shared state

## Pipeline Gates (enforced by hooks)

O pipeline de design-to-implementation tem gates automaticos. Hooks bloqueiam progressao se gates nao forem cumpridos.

### Fluxo completo
```
/constitution (1x por projeto) → brainstorming → /phase-gate (Post-Spec) → writing-plans → /pre-implementation-audit → /phase-gate (Post-Plan) → execution
```

### Regras
- **Constitution**: criar antes ou durante primeiro brainstorming de um projeto. Se `docs/superpowers/constitution.md` nao existe, hook lembra. Define principios nao-negociaveis do projeto
- **Phase Gate (Post-Spec)**: apos brainstorming escrever spec, DEVE rodar `/phase-gate` antes de `writing-plans`. Hook bloqueia `writing-plans` se gate nao existe. Valida: sem tech leaks no spec, clarification coverage, constitution compliance
- **Pre-Implementation Audit**: apos `writing-plans`, DEVE rodar `/pre-implementation-audit` antes de execution. Cruza spec vs plan: forward traceability (req → task), reverse traceability (task → req), constitution compliance
- **Phase Gate (Post-Plan)**: apos audit, DEVE rodar `/phase-gate` antes de `subagent-driven-development`/`executing-plans`. Hook bloqueia execution se gate ou audit nao existe
- Artefatos salvos em: `docs/superpowers/gates/`, `docs/superpowers/audits/`, `docs/superpowers/constitution.md`

### Skills de governanca
- `constitution` — governança per-project (principios, forbidden patterns, quality priorities)
- `phase-gate` — checklists formais entre fases (auto-validados onde possivel)
- `pre-implementation-audit` — analise read-only de consistencia cross-artifact

## Important Concepts
Focus on these principles in all code:
- e2e type-safety
- error monitoring/observability
- automated tests
- readability/maintainability

Detailed guidelines are in skills (use the most specific one for the task):
- Code: `code-quality` (CUPID/SOLID/patterns) | `functional-programming` (FP/ROP)
- Language: `typescript` (TS/JS) | `go` (Go) | `react` (React/Next.js) | `nestjs` (NestJS backend)
- Architecture: `architecture-patterns` (Holonomic/CQRS/Saga) | `holonomic-systems` (SCS deep-dive) | `api-design` (REST/webhooks)
- Quality: `ultrathink-review` (deep audit) | `pr-jira-review` (PR + Jira) | `refactoring` (safe improvements)
- Operations: `observability` (logging/tracing) | `debugging` (structured investigation) | `planning` (architecture decisions)
- Design: `figma-to-code` (pixel-perfect Figma pipeline) | `frontend-design` (UI from scratch)
- Governance: `constitution` (project principles) | `phase-gate` (phase checklists) | `pre-implementation-audit` (cross-artifact consistency)
- Loops: `ralph-implement` (card Jira) | `ralph-review` (PR) | `ralph-refactor` (refactoring) | `ralph-cancel` (parar) | `ralph-debug` (bugs) | `ralph-test` (TDD) | `ralph-migrate` (migrations) | `ralph-perf` (performance) | `ralph-docs` (documentação)
- Communication: `code-review-comments` (tom de review)

@RTK.md
