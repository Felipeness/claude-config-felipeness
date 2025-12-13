---
description: Deep code review using SOLID, DRY, KISS, YAGNI, CUPID with Defensive Programming analysis
allowed-tools: Bash(git:*)
---

# Ultrathink Code Review

Analise o codigo com base nos padroes SOLID, DRY, KISS, YAGNI, CUPID e boas praticas de Defensive Programming, Early Return e Short-Circuit Evaluation.

## Checklist de Analise

### Principios SOLID
- [ ] **S** - Single Responsibility: cada funcao/classe faz uma coisa
- [ ] **O** - Open/Closed: extensivel sem modificacao
- [ ] **L** - Liskov Substitution: subtipos substituiveis
- [ ] **I** - Interface Segregation: interfaces pequenas e focadas
- [ ] **D** - Dependency Inversion: depende de abstracoes

### DRY (Don't Repeat Yourself)
- [ ] Sem codigo duplicado (3+ ocorrencias = abstrair)
- [ ] Padroes de validacao reutilizaveis
- [ ] Error handling centralizado

### KISS (Keep It Simple)
- [ ] Sem over-engineering
- [ ] Solucoes simples para problemas simples
- [ ] Um junior entende em 5 minutos?

### YAGNI (You Aren't Gonna Need It)
- [ ] Sem features nao requisitadas
- [ ] Sem "future-proofing" desnecessario
- [ ] Abstracoes usadas mais de uma vez

### CUPID
- [ ] **C** - Composable: componentes combinaveis
- [ ] **U** - Unix Philosophy: faz uma coisa bem
- [ ] **P** - Predictable: mesmo input = mesmo output
- [ ] **I** - Idiomatic: segue convencoes
- [ ] **D** - Domain-based: usa linguagem do dominio

### Defensive Programming
- [ ] Inputs externos validados
- [ ] Edge cases cobertos
- [ ] Null/undefined tratados
- [ ] Erros com mensagens claras

### Control Flow
- [ ] Early returns (max 2 niveis de aninhamento)
- [ ] Short-circuit correto (operacoes caras por ultimo)
- [ ] Guard clauses no inicio das funcoes

### Compatibilidade Node.js
- [ ] Sintaxe compativel com versao do projeto
- [ ] Features modernas suportadas
- [ ] Sem breaking changes

### Qualidade
- [ ] Sem comentarios desnecessarios
- [ ] Sem codigo comentado
- [ ] Funcoes < 20 linhas
- [ ] Max 3 parametros por funcao

## Output Esperado

### Codigo Revisado e Otimizado
```typescript
// Codigo otimizado aqui
```

### Resumo Tecnico das Melhorias
- **Mudancas aplicadas**: lista de otimizacoes
- **Impacto em performance**: melhorias de complexidade/memoria
- **Impacto em manutencao**: legibilidade/testabilidade

### Perguntas ao Autor
- [Questoes de clarificacao]
- [Decisoes de design a discutir]
- [Edge cases a validar]

### Status
- [ ] Aprovado
- [ ] Aprovado com ressalvas
- [ ] Requer mudancas

---

**Criado por FelipeNess** | **12/12/2025**
