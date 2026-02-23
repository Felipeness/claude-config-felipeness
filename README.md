# Claude Code Configuration by FelipeNess

> Configuração profissional para Claude Code com foco em qualidade, type-safety, observabilidade e boas práticas de engenharia de software.

**Autor:** FelipeNess
**Data:** 23 de Fevereiro de 2026
**GitHub:** [github.com/Felipeness](https://github.com/Felipeness)
**Dotfiles:** [github.com/Felipeness/dotfiles](https://github.com/Felipeness/dotfiles)

---

## Sumario

- [Estrutura](#estrutura)
- [Instalacao](#instalacao)
- [Skills](#skills)
- [Commands](#commands)
- [Principios de Codigo](#principios-de-codigo)
- [Workflow Recomendado](#workflow-recomendado)
- [Code Review Ultrathink](#code-review-ultrathink)

---

## Estrutura

```
.claude/
├── CLAUDE.md                # Instrucoes globais (< 150 linhas)
├── CLAUDE-expanded.md       # Versao completa (todas as regras inline)
├── settings.json            # Configuracoes do Claude Code
├── settings.local.json      # Permissoes (wildcards consolidados)
├── play-notification.ps1    # Som ao completar tarefas
├── statusline.ps1           # Status line customizada
├── songs/
│   └── duolingo-correct.mp3 # Notificacao sonora
├── commands/                # Slash commands customizados
│   ├── new-feat.md          # /new-feat - Criar features
│   ├── create-feature.md    # /create-feature - Feature com branch
│   ├── review.md            # /review - Revisar codigo
│   ├── review-staged.md     # /review-staged - Revisar staged
│   ├── ultrathink-review.md # /ultrathink-review - Review profundo
│   ├── open-pr.md           # /open-pr - Abrir PR
│   ├── investigate.md       # /investigate - Investigar
│   ├── investigate-batch.md # /investigate-batch - Investigar (batch)
│   └── trim.md              # /trim - Reduzir PR description
└── skills/                  # Skills carregadas sob demanda
    ├── coding-guidelines/   # Padroes de codigo
    ├── typescript/          # Standards TypeScript/JS
    ├── react/               # Best practices React/Next.js
    ├── software-engineering/# Principios core
    ├── planning/            # Planejamento e arquitetura
    ├── review-changes/      # Code review workflow
    ├── reviewing-code/      # PR/commit reviews
    ├── writing/             # Documentacao e commits
    └── copywriting/         # Marketing content
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

| Skill | Descricao | Quando Usar |
|-------|-----------|-------------|
| `coding-guidelines` | Padroes completos TypeScript/React | Escrevendo codigo novo |
| `typescript` | Standards TypeScript/JavaScript | Codigo TS/JS |
| `react` | Best practices React 19/Next.js | Componentes React |
| `software-engineering` | Principios core de engenharia | Decisoes tecnicas |
| `planning` | Planejamento e arquitetura | Novos projetos |
| `review-changes` | Workflow de code review | Revisando PRs |
| `reviewing-code` | Checklist de review | Reviews rapidos |
| `writing` | Documentacao e commits | Escrita tecnica |
| `copywriting` | Marketing e vendas | Landing pages |
| `ultrathink-review` | Review profundo (SOLID, DRY, etc.) | Reviews completos |

---

## Commands

| Command | Descricao | Uso |
|---------|-----------|-----|
| `/new-feat` | Cria branch + implementa feature | `/new-feat Add user auth` |
| `/review` | Revisa alteracoes contra guidelines | `/review` |
| `/review-staged` | Revisa apenas alteracoes staged | `/review-staged` |
| `/open-pr` | Cria PR com summary e test plan | `/open-pr Add OAuth` |
| `/investigate` | Investiga antes de planejar | `/investigate auth flow` |
| `/investigate-batch` | Investiga com perguntas em batch | `/investigate-batch auth flow` |
| `/create-feature` | Branch + implementacao + QA | `/create-feature Add OAuth` |
| `/ultrathink-review` | Review profundo SOLID/DRY/KISS/CUPID | `/ultrathink-review` |
| `/trim` | Reduz PR description em 70% | `/trim` |

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

### Engenharia de Software
- KISS (Keep It Simple)
- YAGNI (You Aren't Gonna Need It)
- Testes de comportamento (nao implementacao)
- Observabilidade e monitoring

---

## MCP Servers

| Server | Pacote | Uso |
|--------|--------|-----|
| **Context7** | `@upstash/context7-mcp` | Docs atualizadas de bibliotecas (evita alucinacoes) |
| **DeepWiki** | `mcp-deepwiki` | Wiki estruturada de repos GitHub |
| **Playwright** | `@playwright/mcp` | Automacao de browser e testes |
| **Claude in Chrome** | Extension | Debug console/network/DOM em Chrome real |

### Estrategia MCP

```
Research (Context7/DeepWiki) → Debug (Playwright/Chrome) → Document (Excalidraw)
```

> Nao exagere: 4 MCPs diarios e mais efetivo que 15.

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

## Workflow Recomendado

```
1. Planeje (Shift+Tab para Plan Mode)
2. Execute (/new-feat ou /create-feature)
3. Revise (/review ou /ultrathink-review)
4. Aplique melhorias
5. Abra PR (/open-pr)
6. Commite imediatamente apos completar
```

### Dicas

- **Plan Mode primeiro**: Sempre comece tarefas nao-triviais em plan mode
- **50% Context**: Use `/compact` antes de atingir 50% do context window
- **Subtasks**: Quebre tarefas para caber em 50% do context window
- **Git Worktrees**: Trabalhe em multiplas features simultaneamente
- **Staged vs Unstaged**: Deixe implementacao em staged e melhorias em unstaged para comparar
- **Vanilla > Complexo**: Claude Code com tarefas bem definidas supera workflows fragmentados
- **Economize contexto**: Nao use Claude como terminal, copie apenas erros relevantes

---

## Code Review Ultrathink

O skill `ultrathink-review` implementa um review profundo baseado em:

### Principios Analisados

| Principio | Descricao |
|-----------|-----------|
| **SOLID** | Single Responsibility, Open/Closed, Liskov, Interface Segregation, Dependency Inversion |
| **DRY** | Don't Repeat Yourself |
| **KISS** | Keep It Simple, Stupid |
| **YAGNI** | You Aren't Gonna Need It |
| **CUPID** | Composable, Unix Philosophy, Predictable, Idiomatic, Domain-based |

### Verificacoes Adicionais

- **Defensive Programming**: Validacao de inputs, edge cases
- **Early Return**: Codigo flat, sem if-else chains
- **Short-Circuit Evaluation**: Uso correto de && e ||
- **Compatibilidade Node.js**: Versao especifica do projeto
- **Carga Cognitiva**: Reducao de complexidade mental

### Output do Review

```
## Codigo Revisado
[Codigo otimizado]

## Resumo Tecnico
- Melhorias aplicadas
- Impacto em performance
- Impacto em manutencao

## Perguntas ao Autor
- [Questoes de clarificacao]
- [Sugestoes de discussao]
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

## Economizando Tokens

| Abordagem | Tokens |
|-----------|--------|
| Sem skills (tudo no CLAUDE.md) | ~1000 tokens |
| Com skills (sob demanda) | ~120 tokens |

**Economia:** ~88% de tokens

---

## Referencias

- **Dotfiles completos:** [github.com/Felipeness/dotfiles](https://github.com/Felipeness/dotfiles)
- **Claude Code Docs:** [docs.anthropic.com](https://docs.anthropic.com)
- **OWASP Top 10:** [owasp.org](https://owasp.org)
- **WCAG 2.0:** [w3.org/WAI/WCAG21/quickref](https://www.w3.org/WAI/WCAG21/quickref)

---

## Licenca

MIT License - Use e modifique livremente.

---

**Criado por FelipeNess** | **Atualizado em 23/02/2026**

> *"Code is reference, history, and functionality - it must be readable as a journal."*

> *"De um certo ponto adiante não há volta. Esse é o ponto que deve ser alcançado."*
> — Franz Kafka
