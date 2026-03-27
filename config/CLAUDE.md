## Git Workflow
- Do not include "Claude Code" in commit messages
- Commit immediately upon task completion
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

## Preferências de código (agnóstico de linguagem — TS, Go, Python)

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

### Tipos e segurança
- Tipos fortes sempre — nunca `any` (TS), nunca `interface{}` sem necessidade (Go), type hints (Python)
- Discriminated unions > boolean flags — estados impossíveis devem ser irrepresentáveis
- Branded/newtype para evitar primitive obsession (`UserId` ≠ `PostId`)
- Validar na boundary (Zod/schemas/pydantic), confiar internamente — parse don't validate
- Funções totais — tipo de retorno reflete todos os casos possíveis, sem `!` ou acesso não-checado
- Exhaustive matching — usar `never` assertion ou ts-pattern `.exhaustive()` em switches de unions
- `as const` objects > TypeScript enums — menor bundle, tree-shakeable, sem surpresas de reverse mapping
- Timeouts e retry limits explícitos em toda chamada externa — nunca confiar em defaults de libs

### Paradigma e estrutura
- Composição > herança — sempre
- Funções puras para regras de negócio, side effects isolados nas bordas (Functional Core / Imperative Shell)
- Imutabilidade por padrão — `const`/`readonly` (TS), values (Go), frozen/tuple (Python)
- CQS: query OU command, nunca ambos — funções que leem não alteram estado
- Declarativo > imperativo — diga O QUE, não COMO (`.map/.filter` > `for` loops)
- Idempotência em operações de escrita — SET > INCREMENT, idempotency keys

### Organização
- Funções < 20 linhas, max 3 parâmetros (usar struct/objeto se mais)
- Código deve gritar o domínio, não o framework (Screaming Architecture)
- Erros com contexto da operação sem "failed to" redundante — `"create user: %w"` > `"failed to create user: failed to insert: failed to..."`
- Named exports > default exports (TS), exported types claros (Go)
- Result/Either pattern para erros esperados do negócio, exceptions para erros do sistema
- Import direto do arquivo fonte > barrel files (index.ts) — tree-shaking, sem circular deps
- Table-driven tests para variações de input/output — elimina copy-paste de test functions

## Anti-patterns comuns (evitar sempre)

### Abstração e escopo
- Não criar abstrações prematuras (helpers, utils, wrappers) para coisas usadas 1x — 3 linhas repetidas é melhor que 1 abstração desnecessária
- Não expandir escopo além do pedido — corrigir 1 bug não é desculpa para refatorar 3 módulos não-relacionados
- Não adicionar features, validações ou configurabilidade que não foram pedidas
- Não criar arquivos novos quando editar um existente resolve
- Não criar barrel files (index.ts) só para re-exportar — mata tree-shaking e esconde circular deps

### Tipos e segurança
- Não usar `any` — preferir `unknown` com type guards ou tipos explícitos
- Não usar `as` para forçar tipos — escrever narrowing/type guard adequado
- Não usar `!` (non-null assertion) — tratar o caso undefined explicitamente
- Não usar strings onde union types/enums/branded types servem — evitar stringly-typed APIs
- Não espalhar `req.body` direto em operações de banco — allowlist de campos explícita (mass assignment)
- Não usar TypeScript enums — preferir `as const` objects (menor bundle, sem reverse mapping surpresa)

### Erros e resiliência
- Não envolver tudo em try/catch genérico — tratar erros específicos nas boundaries
- Não engolir erros silenciosamente — `catch {}` vazio é proibido, sempre logar ou propagar
- Não empilhar "failed to" em cada camada de erro — contexto sem redundância
- Não over-engineer error handling para cenários que não podem acontecer
- Não fazer chamadas externas sem timeout explícito — HTTP, DB, RPC sempre com deadline
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
- Não validar redundantemente em todas as camadas — validar na boundary, confiar internamente
- Não usar APIs/libs deprecated do training data — verificar versão atual antes de sugerir

## Important Concepts
Focus on these principles in all code:
- e2e type-safety
- error monitoring/observability
- automated tests
- readability/maintainability

Detailed guidelines are in skills (use the most specific one for the task):
- Code: `code-quality` (CUPID/SOLID/patterns) | `functional-programming` (FP/ROP)
- Language: `typescript` (TS/JS) | `go` (Go) | `react` (React/Next.js)
- Architecture: `architecture-patterns` (Holonomic/CQRS/Saga) | `holonomic-systems` (SCS deep-dive) | `api-design` (REST/webhooks)
- Quality: `ultrathink-review` (deep audit) | `pr-jira-review` (PR + Jira) | `refactoring` (safe improvements)
- Operations: `observability` (logging/tracing) | `debugging` (structured investigation) | `planning` (architecture decisions)
- Design: `figma-to-code` (pixel-perfect Figma pipeline) | `frontend-design` (UI from scratch)
- Loops: `ralph-implement` (card Jira) | `ralph-review` (PR) | `ralph-refactor` (refactoring) | `ralph-cancel` (parar)
- Communication: `code-review-comments` (tom de review)