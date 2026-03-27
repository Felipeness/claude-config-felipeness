---
name: holonomic-systems
description: Holonomic Systems (Sistema Holonomico) — Arthur Koestler's holon theory applied to software architecture. Self-Contained Systems (SCS), Janus Effect, holarchy, autonomous vertical slices, event-driven integration, and Conway's Law alignment. Use when designing system-of-systems, defining service boundaries, structuring teams around domains, or evaluating autonomy vs. integration balance.
---

# Sistema Holonomico — Complete Reference

## 1. Fundacao Filosofica

**Holon** (Arthur Koestler, "The Ghost in the Machine", 1967):
- **holos** (grego) = "todo" + **on** = "parte"
- Algo que e simultaneamente um TODO completo e uma PARTE de algo maior
- Nao e puramente parte. Nao e puramente todo. E AMBOS.

**Holarquia**: hierarquia de holons aninhados (Biosfera > Ecossistema > Organismo > Orgao > Celula). Cada nivel tem autonomia real.

**Efeito Janus** (deus romano de duas faces): todo holon possui duas tendencias em tensao dinamica:
- **Tendencia auto-afirmativa**: preservar autonomia individual (deploy independente, dados proprios, decisoes locais)
- **Tendencia integrativa**: funcionar como parte do todo (contratos, eventos, participacao no sistema)

Se perde integracao = elemento isolado, inutil.
Se perde autonomia = engrenagem passiva, fragil.
A sabedoria esta no EQUILIBRIO.

**Canon vs Strategy** (Koestler):
- Canon = regras fixas, contratos, schemas (API contracts, event formats, SLAs)
- Strategy = implementacao flexivel (linguagem, framework, DB, arquitetura interna)

---

## 2. Self-Contained Systems (SCS) — Implementacao Pratica

SCS (INNOQ, scs-architecture.org) e a implementacao tecnica do conceito holonomico.

### Caracteristicas de um Holon de Software

| Caracteristica | Definicao | Implicacao |
|---|---|---|
| Autonomo | Aplicacao web completa | Funciona sozinho |
| Dados proprios | Banco/schema separado | Nao compartilha estado |
| Equipe unica | Um time e dono | Ownership claro (Conway's Law) |
| Comunicacao assincrona | Nao acessa outros no request cycle | Eventos, nao HTTP sync |
| UI propria | Vertical slice completo | Opcional para APIs puras |
| Sem codigo compartilhado | Sem libs de negocio compartilhadas | Apenas infra (DB drivers, auth) |
| Polyglot | Cada holon escolhe sua stack | Canon define contratos, nao tech |

### Regra de Ouro

> "Other SCSs or external systems should not be accessed synchronously within the SCS's own request/response cycle."

### Mecanismos de Integracao (ordem de preferencia)

1. **UI-level** — hyperlinks entre sistemas (menor acoplamento)
2. **Eventos assincronos** — Kafka, RabbitMQ, Temporal Signals
3. **Replicacao de dados** — cada holon mantem copia local do que precisa
4. **REST HTTP** — ultimo recurso, nunca sincrono no request path

---

## 3. SCS vs Microservices vs Modular Monolith

| Aspecto | Microservices | SCS (Holonomico) | Modular Monolith |
|---|---|---|---|
| Quantidade | Dezenas/centenas | Poucos (5-15) | 1 (modulos internos) |
| Deploy | Separado obrigatorio | Pode ser separado | Junto |
| Dados | Banco separado | Banco separado | Schema separado |
| Comunicacao | HTTP sync OK | **Eventos (async)** | In-process |
| Bounded Context | 1:1 ou N:1 | **1:1 (sempre)** | 1:1 (idealmente) |
| UI | Opcional (frontend separado) | **Obrigatoria (vertical slice)** | Junto |
| Team mapping | Muitos servicos por time | **1 time = 1 holon** | Time compartilhado |

---

## 4. Temporal como Sistema Nervoso

No Sistema Holonomico, Temporal orquestra a comunicacao entre holons:

- **Signals** = comunicacao ENTRE holons (assincrono, fire-and-forget, baixo acoplamento)
- **Activities** = execucao DENTRO do holon (sincrono, implementacao local)
- **Queries** = consulta de estado (read-only)
- **Workflows** = fluxos duraveis que coordenam signals e activities

| Aspecto | Signal | Activity |
|---|---|---|
| Natureza | Assincrono | Sincrono |
| Uso | Comunicar ENTRE holons | Executar DENTRO do holon |
| Acoplamento | Baixo (so contrato) | Medio (implementacao) |
| Exemplo | "Pedido confirmado" | "Salvar no banco" |

---

## 5. O Diagnostico Janus — Anti-Patterns

### Autonomia suprimida (Armadilha do Monolito)
- Componentes sao so partes, sem independencia
- Nao pode deployar, falhar ou escalar independentemente
- Mudanca de um time quebra outro
- **Sintomas**: banco compartilhado, deploy unico, big bang releases

### Integracao suprimida (Monolito Distribuido)
- Autonomia nominal mas acoplamento real
- HTTP sincrono em cascata entre servicos
- Libs de negocio compartilhadas acoplam deploy
- **Sintomas**: servico A nao responde sem B, C, D. Deploy de A requer deploy simultaneo de B, C, D

### Holons Anemicos
- Servico que se diz autonomo mas nao tem auto-regulacao
- CRUD proxy sem logica de dominio
- Servico com logica mas sem UI — depende de frontend team externo
- **Sintomas**: mudanca de feature requer 3+ servicos coordenados

### Holarquia fragmentada demais
- Centenas de microservicos quando 10-15 SCS resolveriam
- Complexidade operacional sem ganho de autonomia
- **Sintomas**: acao simples dispara 20+ chamadas inter-servico

---

## 6. Relacao com Outros Patterns

| Pattern | Relacao com Holonomico |
|---|---|
| DDD Bounded Context | Holon e um BC com UI + dados + deploy. BC e mais fino (so modelo de dominio) |
| Team Topologies | Stream-aligned teams = donos de holons. Conway's Law a favor |
| Hexagonal Architecture | Estrutura interna de cada holon (ports + adapters) |
| CQRS/Event Sourcing | Complementar DENTRO de um holon |
| Saga Pattern | Para workflows ENTRE holons |
| Clean Architecture | Layers dentro de cada holon |
| Strangler Fig | Migracao de monolito para holonomico |

---

## 7. Organizacoes Holonomicas (Paralelos)

| Organizacao | Modelo | Principio |
|---|---|---|
| Kyocera | Amoeba Management (5-50 pessoas) | Unidades autonomas com P&L proprio |
| Haier | RenDanHeYi (4000+ micro-empresas) | Cada ME opera como empresa autonoma |
| Visa | Chaordic Organization | Bancos semi-autonomos com standards compartilhados |
| W.L. Gore | Lattice Organization | Rede flat sem hierarquia, plantas < 200 pessoas |
| Holacracy | Circulos aninhados (Brian Robertson) | Inspirado em holarchias de Ken Wilber |

---

## 8. Desafios de Comunicacao Assincrona

- **Ordenacao de eventos**: Kafka garante ordem por particao
- **Idempotencia**: at-least-once delivery exige operacoes idempotentes
- **Consistencia eventual**: UIs devem mostrar indicadores de estado
- **Debug distribuido**: correlation IDs + tracing (Jaeger/Zipkin)
- **Transactional outbox**: para evitar dual-write (evento + banco)

---

## 9. Caminho de Evolucao

```
Modular Monolith → Separate Schemas → Introduce Messaging → Holonomic System
```

- Cada passo e reversivel
- So evolua quando a dor justifica a complexidade
- Use Strangler Fig para migracao de legacy

---

## 10. Quando Usar / Evitar

| Situacao | Holonomico? |
|---|---|
| Dominio complexo com multiplos bounded contexts | Sim |
| Time grande (5+ devs), times independentes necessarios | Sim |
| Deploy independente necessario | Sim |
| Comunicacao assincrona e aceitavel | Sim |
| Alta disponibilidade critica | Sim |
| MVP rapido | Comece com Modular Monolith |
| CRUD simples | Overkill |
| Consistencia forte obrigatoria entre modulos | Microservices pode ser melhor |
| Time sem experiencia distribuida | Comece simples |

---

## 11. Decision Checklist

- [ ] Cada componente pode deployar independentemente?
- [ ] Cada componente tem seus proprios dados?
- [ ] Cada componente inclui sua propria UI (ou e API pura)?
- [ ] Um time pode ser dono completo de cada componente?
- [ ] Comunicacao entre componentes e assincrona?
- [ ] Cada componente se auto-regula (health checks, metricas, circuit breakers)?
- [ ] Temos 5-15 holons, nao centenas?
- [ ] Contratos (eventos/APIs) sao versionados e documentados?

---

## Referencias

- Koestler, Arthur. "The Ghost in the Machine" (1967)
- [scs-architecture.org](https://scs-architecture.org/)
- [INNOQ - Self-contained Systems](https://www.innoq.com/en/articles/2016/11/self-contained-systems-different-microservices/)
- [Team Topologies](https://teamtopologies.com/)
- Ken Wilber, "Sex, Ecology, Spirituality" (1995)
