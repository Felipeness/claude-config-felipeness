---
name: pr-jira-review
description: Complete PR review pipeline — cross-references with Jira task, runs ultrathink-review (SOLID/DRY/KISS/YAGNI/CUPID), and simplify (reuse/quality/efficiency). Posts findings inline on GitHub and summary on Jira.
---

# PR + Jira Cross-Reference Review

Review completo de PR em 3 camadas: Jira compliance, qualidade profunda, e simplificacao.

## Input

O usuario fornece:
- URL ou numero do PR (ex: `#123`, `https://github.com/org/repo/pull/123`)
- Repositorio (se nao estiver claro pelo contexto)

## Workflow

### Fase 1 — Contexto (PR + Jira)

#### 1.1 Coletar contexto do PR

```bash
gh pr view <PR> --json title,body,url,headRefName,baseRefName,files,reviews,comments
gh pr diff <PR>
```

- Extrair link do Jira da descricao do PR (pattern: `CC-\d+`, `[A-Z]+-\d+`, ou URL do Jira)
- Se nao encontrar link do Jira, perguntar ao usuario

#### 1.2 Buscar card do Jira

Usar **browser MCP** (Chrome) para acessar o Jira:
- Navegar para o card do Jira
- Extrair: titulo, descricao, criterios de aceite, comentarios relevantes
- Nunca usar API direta do Jira (auth via token tem dado problema recorrente)

#### 1.3 Cruzar mudancas vs criterios de aceite

Para cada arquivo alterado no PR:
1. Ler o diff completo
2. Mapear quais criterios de aceite cada mudanca atende
3. Identificar:
   - Criterios de aceite atendidos
   - Criterios de aceite NAO atendidos
   - Mudancas que extrapolam o escopo do card

---

### Fase 2 — Ultrathink Review (qualidade profunda)

Aplicar o protocolo completo do skill `ultrathink-review` sobre o codigo alterado:

#### SOLID
- [ ] **S** - Single Responsibility: cada funcao/classe faz uma coisa
- [ ] **O** - Open/Closed: extensivel sem modificacao
- [ ] **L** - Liskov Substitution: subtipos substituiveis
- [ ] **I** - Interface Segregation: interfaces pequenas e focadas
- [ ] **D** - Dependency Inversion: depende de abstracoes

#### DRY
- [ ] Sem codigo duplicado (3+ ocorrencias = abstrair)
- [ ] Padroes de validacao reutilizaveis
- [ ] Error handling centralizado

#### KISS
- [ ] Sem over-engineering
- [ ] Solucoes simples para problemas simples
- [ ] Um junior entende em 5 minutos?

#### YAGNI
- [ ] Sem features nao requisitadas
- [ ] Sem "future-proofing" desnecessario
- [ ] Abstracoes usadas mais de uma vez

#### CUPID
- [ ] **C** - Composable: componentes combinaveis
- [ ] **U** - Unix Philosophy: faz uma coisa bem
- [ ] **P** - Predictable: mesmo input = mesmo output
- [ ] **I** - Idiomatic: segue convencoes do codebase
- [ ] **D** - Domain-based: usa linguagem do dominio

#### Defensive Programming & Control Flow
- [ ] Inputs externos validados nas boundaries
- [ ] Edge cases cobertos
- [ ] Null/undefined tratados
- [ ] Early returns (max 2 niveis de aninhamento)
- [ ] Short-circuit correto (operacoes caras por ultimo)
- [ ] Guard clauses no inicio das funcoes

#### Qualidade
- [ ] Sem comentarios desnecessarios ou codigo comentado
- [ ] Funcoes < 20 linhas, max 3 parametros
- [ ] Sem `any` types, sem `as` forcado, sem `!` non-null
- [ ] Named exports, sem barrel files
- [ ] Testes para features/fixes novos

---

### Fase 3 — Simplify (reuso, qualidade, eficiencia)

Aplicar o protocolo do skill `simplify` sobre o codigo alterado:

1. **Reuso**: existe codigo similar no codebase que pode ser reutilizado? Grep antes de criar
2. **Eficiencia**: N+1 queries? `await` sequencial desnecessario? Queries sem LIMIT?
3. **Simplificacao**: abstraccoes desnecessarias? Pode ser mais simples sem perder clareza?
4. **Dead code**: algo foi adicionado que nao e usado? Imports nao utilizados?

Se encontrar melhorias, sugerir codigo otimizado concreto (nao apenas apontar o problema).

---

### Fase 4 — Postar review no GitHub

Postar comments **inline** em cada ponto especifico — nunca um comentario unico consolidado.

Cada finding das 3 fases vira um comment separado no local exato do codigo.

Regras de tom:
- Educado, gentil, humano — como colega de equipe respondendo naturalmente
- Referenciar commits pelo **nome/mensagem** (ex: "resolvi no commit `fix: add error guards`"), nunca pelo hash
- Usar portugues (pt-BR) nos comentarios

Formato dos comments:

**Blocking (request changes):**
```
Esse trecho pode causar [problema]. Sugiro [alternativa] porque [razao].

Referencia: criterio de aceite "[texto do criterio]" do card CC-XXX.
```

**Non-blocking (sugestao de qualidade/simplificacao):**
```
Sugestao: [melhoria]. Nao bloqueia o merge, mas melhora [aspecto].
```

**Positivo:**
```
Ficou otimo aqui — [elogio especifico].
```

Categorizar cada comment com prefixo:
- `[Jira]` — relacionado a criterio de aceite
- `[Qualidade]` — encontrado pelo ultrathink-review
- `[Simplify]` — encontrado pela analise de simplificacao

---

### Fase 5 — Postar resumo no Jira

Escrever o payload do comentario em arquivo temporario e usar browser MCP para postar no Jira:

```
Review do PR #<numero> (<url>)

Criterios de aceite:
- [x] Criterio 1 — atendido
- [x] Criterio 2 — atendido
- [ ] Criterio 3 — pendente (comentario no PR)

Qualidade (ultrathink):
- X findings blocking, Y sugestoes
- Principios: [quais foram violados, se algum]

Simplificacao:
- [oportunidades encontradas, se alguma]

Status: Aprovado / Aprovado com ressalvas / Requer mudancas
```

---

### Fase 6 — Resultado final

Apresentar ao usuario:

1. **Cobertura Jira** — checklist de criterios atendidos/pendentes
2. **Qualidade** — resumo dos findings do ultrathink (blocking vs non-blocking)
3. **Simplificacao** — oportunidades de melhoria encontradas
4. **Acoes** — comments postados no GitHub + resumo no Jira
5. **Veredicto** — Aprovado / Aprovado com ressalvas / Requer mudancas
