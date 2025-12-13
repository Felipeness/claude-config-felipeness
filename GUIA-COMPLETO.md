# Guia Completo de Configuracao Claude Code

**Autor:** FelipeNess
**Data:** 12 de Dezembro de 2025
**GitHub:** [github.com/Felipeness](https://github.com/Felipeness)
**Dotfiles:** [github.com/Felipeness/dotfiles](https://github.com/Felipeness/dotfiles)

---

## Indice

- [O que e esta configuracao](#o-que-e-esta-configuracao)
- [Instalacao](#instalacao)
- [Estrutura de Arquivos](#estrutura-de-arquivos)
- [Skills Explicadas](#skills-explicadas)
- [Commands Explicados](#commands-explicados)
- [Ultrathink Review - Prompt de Revisao Profunda](#ultrathink-review---prompt-de-revisao-profunda)
- [Principios de Codigo](#principios-de-codigo)
- [Workflow Recomendado](#workflow-recomendado)
- [Dicas de Economia de Tokens](#dicas-de-economia-de-tokens)
- [Referencias](#referencias)

---

## O que e esta configuracao

Esta configuracao profissional para Claude Code foi criada para garantir:

- **Type-safety de ponta a ponta** (API -> Database -> UI)
- **Observabilidade e monitoring** de erros
- **Testes automatizados** de comportamento
- **Legibilidade e manutencao** de codigo

A configuracao usa **Skills** (carregadas sob demanda) para economizar tokens e manter o contexto limpo.

---

## Instalacao

### Windows (PowerShell)

```powershell
# Copia a pasta .claude para o diretorio global
Copy-Item -Recurse ".claude" "$HOME\.claude"
```

### Linux/Mac

```bash
# Copia a pasta .claude para o diretorio global
cp -r .claude ~/.claude
```

### Por Projeto (alternativa)

```bash
# Copia para raiz do projeto
cp -r .claude /seu/projeto/.claude
```

---

## Estrutura de Arquivos

```
.claude/
├── CLAUDE.md              # Instrucoes carregadas em toda conversa
├── settings.json          # Configuracoes do Claude Code
├── commands/              # Slash commands customizados
│   ├── new-feat.md        # /new-feat [desc] - Criar features
│   ├── review.md          # /review - Revisar codigo
│   ├── review-staged.md   # /review-staged - Revisar staged
│   ├── open-pr.md         # /open-pr [titulo] - Abrir PR
│   ├── investigate.md     # /investigate [topico] - Investigar
│   ├── trim.md            # /trim - Reduzir PR description
│   └── ultrathink-review.md # /ultrathink-review - Review profundo
└── skills/                # Carregadas sob demanda
    ├── coding-guidelines/ # Padroes completos de codigo
    ├── typescript/        # Standards TypeScript/JS
    ├── react/             # Best practices React/Next.js
    ├── software-engineering/ # Principios de engenharia
    ├── planning/          # Planejamento e arquitetura
    ├── review-changes/    # Workflow de code review
    ├── reviewing-code/    # Reviews rapidos
    ├── writing/           # Documentacao e commits
    ├── copywriting/       # Marketing e vendas
    └── ultrathink-review/ # SOLID, DRY, KISS, YAGNI, CUPID
```

---

## Skills Explicadas

### coding-guidelines
Padroes completos para projetos TypeScript/JavaScript com React. Inclui:
- Type-safety (nunca `any`, quase nunca `as`)
- Organizacao de codigo (named exports, sem index files desnecessarios)
- Convencoes de nomenclatura (camelCase, kebab-case, SNAKE_CAPS)
- Boas praticas React (componentes puros, React Query, Suspense)

**Quando usar:** Escrevendo codigo novo, refatorando, configurando projeto.

### typescript
Standards especificos para TypeScript/JavaScript:
- Strict TypeScript
- E2E type-safety
- Prefer async/await
- Early returns

**Quando usar:** Qualquer codigo TypeScript/JavaScript.

### react
Best practices React 19 e Next.js:
- Use `use`, `useTransition`, `startTransition`
- Evite `useEffect`
- React Query para data fetching
- Suspense e Error Boundaries

**Quando usar:** Componentes React, Next.js.

### software-engineering
Principios core de engenharia:
- KISS, YAGNI
- Observabilidade
- Functional programming
- Seguranca (OWASP)
- Acessibilidade (WCAG 2.0)

**Quando usar:** Decisoes tecnicas, arquitetura.

### planning
Workflow de planejamento:
- Entender requisitos
- Escolher tecnologias
- Design de arquitetura
- Estrategia de testes
- Observabilidade

**Quando usar:** Novos projetos, decisoes de arquitetura.

### review-changes / reviewing-code
Workflows de code review:
- Checklist completo
- Prioridades (critico, alto, medio, baixo)
- Formato de output estruturado

**Quando usar:** Revisando PRs, commits, diffs.

### writing
Standards de escrita tecnica:
- Clareza e brevidade
- Voz ativa
- Commit messages
- Documentacao

**Quando usar:** README, docs, commits, PRs.

### copywriting
Principios de marketing:
- Beneficios > Features
- Pain points
- Especificidade

**Quando usar:** Landing pages, marketing, vendas.

### ultrathink-review
Review profundo usando:
- SOLID, DRY, KISS, YAGNI, CUPID
- Defensive Programming
- Early Return
- Short-Circuit Evaluation

**Quando usar:** Reviews completos, auditorias de codigo.

---

## Commands Explicados

### /new-feat [descricao]
Cria uma nova feature seguindo todas as guidelines.

```
/new-feat Add user authentication with OAuth
```

**O que faz:**
1. Analisa codebase existente
2. Planeja a feature
3. Implementa com type-safety
4. Adiciona testes
5. Segue boas praticas

### /review
Revisa alteracoes atuais contra as guidelines.

```
/review
```

**Analisa:**
- Type-safety
- Naming e clareza
- React best practices
- Seguranca (OWASP)
- Acessibilidade (WCAG)
- Performance

### /review-staged
Revisa apenas alteracoes em staged.

```
git add src/auth.ts
/review-staged
```

### /open-pr [titulo]
Cria PR com summary e test plan.

```
/open-pr Add OAuth authentication
```

**Gera:**
- Summary com bullet points
- Test plan com checklist
- Notes de deployment

### /investigate [topico]
Investiga antes de planejar/implementar.

```
/investigate authentication flow
```

**Retorna:**
- O que existe hoje
- Gaps de conhecimento
- Abordagem sugerida

### /trim
Reduz descricao de PR em 70%.

```
/trim
```

### /ultrathink-review
Review profundo com SOLID, DRY, KISS, YAGNI, CUPID.

```
/ultrathink-review
```

---

## Ultrathink Review - Prompt de Revisao Profunda

O prompt Ultrathink Review foi criado para analises profundas de codigo. Aqui esta o prompt completo que voce pode usar:

### Prompt Completo

```
Ultrathink, revise este PR:

Analise o codigo com base nos padroes SOLID, DRY, KISS, YAGNI, CUPID e boas praticas
de Defensive Programming, Early Return e Short-Circuit Evaluation.

Verifique se o codigo e compativel com Node.js versao [X], se nao ha bugs, quebras,
mas praticas ou inconsistencias logicas.

Veja se tem comentarios desnecessarios e codigos comentados que nao estejam em uso.

Priorize reducao de carga cognitiva, legibilidade, clareza sem perda de contexto,
e mantenha estilo conciso e expressivo.

Saida esperada:
- Codigo revisado e otimizado
- Resumo tecnico das melhorias aplicadas
- Impacto esperado em performance e manutencao
- Perguntas e comentarios para fazer ao autor
```

### O que cada principio significa

| Principio | Significado | O que verificar |
|-----------|-------------|-----------------|
| **SOLID** | 5 principios de design OOP | SRP, OCP, LSP, ISP, DIP |
| **DRY** | Don't Repeat Yourself | Codigo duplicado (3+ = abstrair) |
| **KISS** | Keep It Simple | Over-engineering, complexidade |
| **YAGNI** | You Aren't Gonna Need It | Features nao requisitadas |
| **CUPID** | Composable, Unix, Predictable, Idiomatic, Domain | Qualidades de bom codigo |

### Defensive Programming

- Validar todos inputs externos
- Tratar edge cases
- Null/undefined handling
- Mensagens de erro claras

### Early Return

```typescript
// Ruim - aninhado
function process(user) {
  if (user) {
    if (user.isActive) {
      if (user.hasPermission) {
        return doWork(user);
      }
    }
  }
  return null;
}

// Bom - early return
function process(user) {
  if (!user) return null;
  if (!user.isActive) return null;
  if (!user.hasPermission) return null;
  return doWork(user);
}
```

### Short-Circuit Evaluation

```typescript
// Bom - operacao cara por ultimo
const isValid = simpleCheck && anotherSimple && expensiveOperation();

// Default values
const name = user?.name || 'Anonymous';
```

---

## Principios de Codigo

### Type Safety
- Nunca use `any`
- Quase nunca use `as`
- E2E type-safety (API -> Database -> UI)
- Query builders (nao SQL puro)

### Naming
- Nomes descritivos (sem abreviacoes)
- `camelCase` funcoes
- `kebab-case` arquivos
- `SNAKE_CAPS` constantes
- Evite: `data`, `info`, `stuff`, `manager`, `helper`

### Control Flow
- Early returns
- Codigo flat (max 2 niveis)
- Hash-lists ao inves de switch

### React
- Componentes puros
- React Query (nao useEffect para data)
- Suspense + Error Boundaries
- Cache keys com enums

### Testing
- Teste comportamento, nao implementacao
- Testes para cada bug corrigido
- Verbos em 3a pessoa (nao "should")
- Organize com describe blocks

---

## Workflow Recomendado

### Fluxo Padrao

```
1. Planeje (Shift+Tab para Plan Mode)
   - Escreva o que sabe sobre a tarefa
   - Adicione referencias de arquivos com @

2. Execute
   - /new-feat para features novas
   - Ou implemente diretamente

3. Revise
   - /review para analise completa
   - /ultrathink-review para analise profunda

4. Aplique melhorias
   - Deixe melhorias em unstaged para comparar

5. Abra PR
   - /open-pr para criar PR formatado
```

### Dicas

**Staged vs Unstaged:**
Deixe implementacao em staged e melhorias em unstaged para comparar as duas versoes.

**Git Worktrees:**
Trabalhe em multiplas features simultaneamente:
```bash
git worktree add ../projeto-feature -b feat/nova-feature
cd ../projeto-feature
claude
```

**Economize contexto:**
- Nao use Claude como terminal
- Copie apenas erros relevantes
- Feche conversas frequentemente

---

## Dicas de Economia de Tokens

### Skills vs CLAUDE.md completo

| Abordagem | Tokens |
|-----------|--------|
| Tudo no CLAUDE.md | ~1000 tokens |
| Com skills (sob demanda) | ~120 tokens |

**Economia:** ~88%

### Evite usar Claude como terminal

**Ruim:**
```
Voce: Rode npm test
Claude: [Executa e mostra 200 linhas]
Custo: 500 tokens
```

**Bom:**
```bash
# Em outro terminal
npm test
# Se der erro, copie apenas a linha relevante
```
Custo: 20 tokens

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

### O que cada opcao faz

| Opcao | Descricao |
|-------|-----------|
| `includeCoAuthoredBy` | Remove "Claude Code" dos commits |
| `alwaysThinkingEnabled` | Pensamento continuo habilitado |
| `includeLineNumbers` | Inclui numeros de linha |
| `autoSave` | Salva automaticamente |
| `preferShorterResponses` | Respostas mais curtas |
| `includeFileContext` | Inclui contexto de arquivos |

---

## Referencias

- **Dotfiles completos:** [github.com/Felipeness/dotfiles](https://github.com/Felipeness/dotfiles)
- **Claude Code Docs:** [docs.anthropic.com](https://docs.anthropic.com)
- **SOLID Principles:** [Wikipedia](https://en.wikipedia.org/wiki/SOLID)
- **CUPID Properties:** [Dan North](https://dannorth.net/cupid-for-joyful-coding/)
- **OWASP Top 10:** [owasp.org](https://owasp.org)
- **WCAG 2.0:** [w3.org](https://www.w3.org/WAI/WCAG21/quickref)

---

## Licenca

MIT License - Use e modifique livremente.

---

**Criado por FelipeNess**
**12 de Dezembro de 2025**
**GitHub:** [github.com/Felipeness](https://github.com/Felipeness)

> *"Code is reference, history, and functionality - it must be readable as a journal."*
