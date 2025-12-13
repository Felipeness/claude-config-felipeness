---
name: ultrathink-review
description: Advanced code review using SOLID, DRY, KISS, YAGNI, CUPID principles with Defensive Programming, Early Return, and Short-Circuit Evaluation. Use for deep PR reviews, comprehensive code analysis, and quality audits.
---

# Ultrathink Code Review

Deep analysis protocol for comprehensive code review.

## When to Use
- Pull request reviews requiring thorough analysis
- Code audits and quality assessments
- Refactoring evaluation
- Architecture review
- Pre-production code validation

## Analysis Framework

### 1. SOLID Principles

#### Single Responsibility (SRP)
- Each class/function has ONE reason to change
- Flag: Functions doing multiple unrelated things
- Flag: Classes with mixed concerns

#### Open/Closed (OCP)
- Open for extension, closed for modification
- Flag: Switch statements that grow with new types
- Prefer: Strategy pattern, composition

#### Liskov Substitution (LSP)
- Subtypes must be substitutable for base types
- Flag: Subclasses that break parent contracts
- Flag: Type checks to determine behavior

#### Interface Segregation (ISP)
- Clients shouldn't depend on unused interfaces
- Flag: Fat interfaces forcing empty implementations
- Prefer: Small, focused interfaces

#### Dependency Inversion (DIP)
- Depend on abstractions, not concretions
- Flag: Direct instantiation of dependencies
- Prefer: Dependency injection

### 2. DRY (Don't Repeat Yourself)

Check for:
- [ ] Duplicated logic (3+ occurrences = abstract)
- [ ] Copy-pasted code with minor variations
- [ ] Repeated validation patterns
- [ ] Similar error handling blocks

Action:
- Extract to reusable functions
- Create shared utilities
- Use higher-order functions
- Note: 2 occurrences is often fine; abstract at 3

### 3. KISS (Keep It Simple, Stupid)

Check for:
- [ ] Over-engineered solutions
- [ ] Unnecessary abstractions
- [ ] Complex patterns for simple problems
- [ ] Premature optimization
- [ ] Framework usage when plain code suffices

Questions:
- Can a junior dev understand this in 5 minutes?
- Is there a simpler way to achieve the same result?
- Does the complexity match the problem complexity?

### 4. YAGNI (You Aren't Gonna Need It)

Check for:
- [ ] Features not in current requirements
- [ ] "Future-proofing" without clear need
- [ ] Unused parameters/options
- [ ] Generic solutions for specific problems
- [ ] Abstractions used only once

Rule: Build what's needed NOW, refactor when requirements change.

### 5. CUPID Properties

#### Composable
- Can components be combined in different ways?
- Are dependencies explicit and injectable?
- Can parts be tested in isolation?

#### Unix Philosophy
- Does each part do one thing well?
- Can components be chained/piped?
- Are interfaces text-based or simple data?

#### Predictable
- Given the same input, same output?
- Are side effects explicit and contained?
- Does naming reflect behavior accurately?

#### Idiomatic
- Follows language/framework conventions?
- Uses standard library appropriately?
- Matches team/project patterns?

#### Domain-based
- Uses domain language (not technical jargon)?
- Reflects business concepts?
- Would domain experts understand the naming?

## Defensive Programming

### Input Validation
- [ ] All external inputs validated
- [ ] Type checking at boundaries
- [ ] Range validation for numbers
- [ ] Format validation for strings
- [ ] Null/undefined handling

### Edge Cases
- [ ] Empty arrays/strings handled
- [ ] Boundary conditions covered
- [ ] Error states considered
- [ ] Race conditions addressed
- [ ] Network failures handled

### Fail-Safe Defaults
- [ ] Sensible default values
- [ ] Graceful degradation
- [ ] Clear error messages
- [ ] Recovery mechanisms

## Control Flow Patterns

### Early Return
```typescript
// Bad - nested conditions
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

// Good - early returns
function process(user) {
  if (!user) return null;
  if (!user.isActive) return null;
  if (!user.hasPermission) return null;
  return doWork(user);
}
```

Check for:
- [ ] Maximum 2 levels of nesting
- [ ] Guard clauses at function start
- [ ] No else after return

### Short-Circuit Evaluation

```typescript
// Good usage
const name = user?.name || 'Anonymous';
const isValid = condition1 && condition2 && expensiveCheck();

// Bad - unnecessary evaluation
const result = expensiveOperation() && simpleCheck; // flip order
```

Check for:
- [ ] Expensive operations last in && chains
- [ ] Default values with || or ??
- [ ] Optional chaining (?.) for nullable access

## Node.js Compatibility

Verify compatibility with project's Node.js version:

### Common Issues
- [ ] ES module syntax vs CommonJS
- [ ] Top-level await (Node 14.8+)
- [ ] Optional chaining (Node 14+)
- [ ] Nullish coalescing (Node 14+)
- [ ] Private class fields (Node 12+)
- [ ] Array methods (flat, flatMap - Node 11+)

### Check package.json
```json
{
  "engines": {
    "node": ">=18"
  }
}
```

## Cognitive Load Reduction

### Readability Metrics
- [ ] Functions < 20 lines
- [ ] Max 3 parameters per function
- [ ] Max 2 levels of nesting
- [ ] Clear variable names (no single letters except loops)
- [ ] Consistent formatting

### Code Organization
- [ ] Related code grouped together
- [ ] Logical ordering (public before private)
- [ ] Clear separation of concerns
- [ ] Minimal file jumps to understand flow

### Mental Model
- [ ] Code tells a story from top to bottom
- [ ] Naming reflects intent, not implementation
- [ ] Comments explain WHY, not WHAT
- [ ] Complex algorithms documented

## Comments & Dead Code

### Unnecessary Comments
Remove:
- [ ] Comments restating the code
- [ ] Commented-out code blocks
- [ ] TODO comments older than 1 sprint
- [ ] Changelog comments (use git)

Keep:
- Business rule explanations
- Non-obvious algorithm descriptions
- Workaround explanations with issue links

### Dead Code
Remove:
- [ ] Unused variables/functions
- [ ] Unreachable code paths
- [ ] Deprecated feature flags
- [ ] Console.log/debug statements

## Review Output Format

### Codigo Revisado e Otimizado
```typescript
// Optimized code here
```

### Resumo Tecnico das Melhorias

#### Mudancas Aplicadas
1. **[Categoria]**: [Descricao da mudanca]
   - Antes: [Codigo/padrao anterior]
   - Depois: [Codigo/padrao novo]
   - Razao: [Justificativa]

#### Impacto em Performance
- [Melhoria de complexidade algoritmica]
- [Reducao de operacoes]
- [Otimizacao de memoria]

#### Impacto em Manutencao
- [Melhoria de legibilidade]
- [Reducao de acoplamento]
- [Aumento de testabilidade]

### Perguntas ao Autor

1. **Clarificacao de Requisitos**
   - [Pergunta sobre comportamento esperado]

2. **Decisoes de Design**
   - [Pergunta sobre escolhas arquiteturais]

3. **Edge Cases**
   - [Pergunta sobre cenarios nao cobertos]

### Status Final

- [ ] **Aprovado** - Codigo pronto para merge
- [ ] **Aprovado com ressalvas** - Melhorias sugeridas, nao bloqueantes
- [ ] **Requer mudancas** - Issues que bloqueiam merge

## Priority Levels

1. **Critico** (Bloqueia merge)
   - Bugs de seguranca
   - Quebras de funcionalidade
   - Violacoes de type-safety
   - Problemas de acessibilidade graves

2. **Alto** (Deve corrigir antes do merge)
   - Violacoes SOLID significativas
   - Codigo duplicado extensivo
   - Falta de tratamento de erro

3. **Medio** (Deveria corrigir)
   - Violacoes KISS/YAGNI
   - Naming unclear
   - Falta de testes

4. **Baixo** (Pode corrigir)
   - Style preferences
   - Minor optimizations
   - Documentation gaps

---

**Criado por FelipeNess** | **12/12/2025**
**GitHub:** [github.com/Felipeness](https://github.com/Felipeness)
