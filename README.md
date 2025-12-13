# Claude Code Configuration by FelipeNess

> Configuração profissional para Claude Code com foco em qualidade, type-safety, observabilidade e boas práticas de engenharia de software.

**Autor:** FelipeNess
**Data:** 12 de Dezembro de 2025
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
├── CLAUDE.md              # Instrucoes globais
├── settings.json          # Configuracoes do Claude Code
├── commands/              # Slash commands customizados
│   ├── new-feat.md        # /new-feat - Criar features
│   ├── review.md          # /review - Revisar codigo
│   ├── review-staged.md   # /review-staged - Revisar staged
│   ├── open-pr.md         # /open-pr - Abrir PR
│   ├── investigate.md     # /investigate - Investigar
│   └── trim.md            # /trim - Reduzir PR description
└── skills/                # Skills carregadas sob demanda
    ├── coding-guidelines/ # Padroes de codigo
    ├── typescript/        # Standards TypeScript/JS
    ├── react/             # Best practices React/Next.js
    ├── software-engineering/ # Principios core
    ├── planning/          # Planejamento e arquitetura
    ├── review-changes/    # Code review workflow
    ├── reviewing-code/    # PR/commit reviews
    ├── writing/           # Documentacao e commits
    ├── copywriting/       # Marketing content
    └── ultrathink-review/ # Review avancado (SOLID, DRY, KISS, YAGNI, CUPID)
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

## Workflow Recomendado

```
1. Planeje (Shift+Tab para Plan Mode)
2. Execute (/new-feat ou implementacao direta)
3. Revise (/review)
4. Aplique melhorias
5. Abra PR (/open-pr)
```

### Dicas

- **Staged vs Unstaged**: Deixe implementacao em staged e melhorias em unstaged para comparar
- **Git Worktrees**: Trabalhe em multiplas features simultaneamente
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

### Desabilitar "Claude Code" nos commits

Ja configurado: `"includeCoAuthoredBy": false`

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

**Criado por FelipeNess** | **12/12/2025**

> *"Code is reference, history, and functionality - it must be readable as a journal."*
