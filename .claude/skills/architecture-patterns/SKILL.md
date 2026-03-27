---
name: architecture-patterns
description: Production architecture and design patterns — Holonomic Systems, Strangler Fig, CQRS, Event Sourcing, Saga, Circuit Breaker, Modular Monolith, Hexagonal, Vertical Slice, and migration strategies. Use when designing systems, planning migrations, choosing architectural approaches, or making infrastructure decisions.
---

# Architecture Patterns — Production Reference

Patterns that top engineering teams actually ship. Start simple, add patterns when pain forces you to.

---

## 1. Holonomic Systems (Sistema Holonômico)

Based on Arthur Koestler's concept of the **holon** — an entity that is simultaneously a complete WHOLE and a PART of something larger. Applied to software by the SCS (Self-Contained Systems) architecture.

### The Janus Effect (dual nature)
Every component exhibits two simultaneous tendencies:
- **Self-assertive**: preserves autonomy (own data, own UI, own deploy)
- **Integrative**: cooperates as part of the larger system (events, contracts)

When the balance breaks:
- **Suppressed autonomy** (monolith) → components are just parts, no independence, failure propagates
- **Suppressed integration** (bad microservices) → nominal autonomy but chaotic coupling, distributed monolith

### Anatomy of a Software Holon
```
PUBLIC INTERFACE (REST/GraphQL, Kafka events)
     |
DOMAIN LOGIC (business rules, workflows)
     |
PERSISTENCE (own database + replicas of external data)
     |
SELF-REGULATION (health checks, circuit breakers, metrics)
```

### Rules
- Holons do NOT import other holons directly — communication via events only
- No synchronous calls between holons in the request/response cycle
- Each holon is a vertical slice: UI + logic + data
- One team per holon (Conway's Law alignment)
- Data replication via event-based updates (eventual consistency)

### Self-Contained Systems (SCS) — practical implementation

| Principle | Rule |
|---|---|
| Autonomous | Complete web application |
| Vertical slice | UI + logic + own data |
| No sync in request/response | Cannot call other SCS synchronously |
| Single team ownership | One team per SCS |
| 5-25 systems | Coarser than microservices |

### SCS vs Microservices

| Aspect | SCS/Holonomic | Microservices |
|---|---|---|
| Quantity | 5-25 | 50-500+ |
| UI | Mandatory (full vertical) | Optional |
| Granularity | Business domain | More granular/atomized |
| Sync in request | Prohibited | Allowed |

### Async Communication Challenges
- **Event ordering**: Kafka guarantees order per partition
- **Duplication**: Mandatory idempotency checks (at-least-once delivery)
- **Eventual consistency**: Accept as operational reality; UI state indicators
- **Distributed debugging**: Correlation IDs across all logs + Jaeger/Zipkin

### Evolution Path
```
Modular Monolith → Separate Schemas → Introduce Messaging → Holonomic System
```
Evolve when the pain justifies it, not prematurely.

### When to use / avoid

| Use when | Avoid when |
|---|---|
| Multiple distinct domains | Small system, single team |
| Teams need independence | MVP or proof of concept |
| High availability critical | Strong consistency is hard requirement |
| Differentiated scaling per domain | Team lacks distributed systems experience |

---

## 2. Architectural Styles

### Modular Monolith
Single deployable, modules with explicit boundaries, each owning domain + data + API surface. Communication through events or defined APIs. **The recommended starting point before microservices.**
- Shopify runs thousands of engineers on a modular monolith
- Modules can be extracted to services later when the need is proven
- Requires discipline to maintain boundaries (no reaching into another module's DB)

### Hexagonal / Ports & Adapters
Core business logic in the center, zero framework dependencies. Defines ports (interfaces), adapters implement them for specific tech. Core never imports an ORM, framework, or SDK.
```
[HTTP Adapter] → [Port: InputPort] → [Domain Core] → [Port: OutputPort] → [Postgres Adapter]
```
- Extremely testable (inject fakes at port level)
- Framework-agnostic, infrastructure swappable

### Vertical Slice Architecture
Organize by feature, not by layer. Each slice: endpoint + handler + validation + data access.
```
Features/
  CreateOrder/    ← everything for this feature in one place
  GetOrderById/
  CancelOrder/
```
- Eliminates cross-cutting "shotgun surgery"
- Each feature independently deployable or deletable
- Intentional code duplication across slices

### CQRS (Command Query Responsibility Segregation)
Separate write model (commands) from read model (queries). Each scales independently.
```
[Command] → [Write Handler] → [Write DB (normalized)]
                                    |  (event/sync)
[Query]  → [Query Handler]  → [Read DB (denormalized, optimized)]
```
- Netflix uses for 260M+ subscribers
- Unlocks read models tailored to specific UI needs
- Only when read/write patterns diverge significantly

### Event Sourcing
Store every state change as immutable event. Current state = replay of events.
```
[Command] → [Aggregate] → [Event Store (append-only)] → [Projections] → [Read DB, Search, Analytics]
```
- Perfect audit trail, time-travel debugging
- Uber uses at petabyte scale (Kafka + Flink)
- Event schema evolution is hard — version events forever
- Needs snapshots for performance

---

## 3. Resilience Patterns

### Circuit Breaker
Monitors calls to downstream service. After failure threshold → opens circuit → rejects calls for cooldown → half-open (test calls) → close if recovered.
- Prevents cascading failure and thread pool exhaustion
- Use on every network call to external dependency
- Tune carefully: too sensitive = false trips, too lenient = delayed protection

### Bulkhead
Isolates resource pools per dependency. Slow payment service can't starve inventory queries.
```
[Service]
  |-- Pool A (50 threads) → Payment Service
  |-- Pool B (30 threads) → Inventory Service
  |-- Pool C (20 threads) → Auth Service
```

### Retry with Exponential Backoff + Jitter
```typescript
// AWS-recommended decorrelated jitter
const delay = Math.min(maxDelay,
  Math.random() * (lastDelay * 3 - baseDelay) + baseDelay
)
```
- Only for idempotent, transient failures
- Never retry deterministic errors (400 Bad Request)
- Without jitter → thundering herd

### Saga Pattern
Sequence of local transactions across services. Each step has a compensating action (rollback).
```
1. createOrder()      | compensate: cancelOrder()
2. chargePayment()    | compensate: refundPayment()
3. reserveStock()     | compensate: releaseStock()
If step 3 fails → refundPayment() → cancelOrder()
```
- **Choreography** (events, no coordinator): max 4-5 steps
- **Orchestration** (central coordinator): for complex flows
- Compensating actions are the hardest part

### Transactional Outbox
Write event to outbox table in the SAME transaction as business data. Relay publishes to Kafka later.
```sql
BEGIN;
  UPDATE orders SET status = 'confirmed';
  INSERT INTO outbox (event_type, payload) VALUES ('OrderConfirmed', '{...}');
COMMIT;
-- Debezium CDC reads WAL → publishes to Kafka
```
- Solves the dual-write problem (most dangerous consistency issue in distributed systems)
- SeatGeek uses in production

### Dead Letter Queue (DLQ)
Captures messages that failed all retries. **Every production queue needs one.**
- Store metadata: original topic, error stack, timestamp, retry count
- Alert on DLQ depth and message age
- Build tooling for inspection and reprocessing

---

## 4. Migration / Evolution Patterns

### Strangler Fig (Martin Fowler, 2004)
Proxy routes traffic between legacy and new system. Migrate piece by piece.
```
[Client] → [Facade/Proxy]
              |         |
        [New Service] [Legacy] ← routes shrink over time
```
**Steps**: Introduce proxy → Identify boundaries (DDD) → Build new service + ACL → Route + validate → Repeat → Decommission legacy

**Anti-patterns**: eternal transition (no sunset plan), premature decomposition, ignoring data migration, insufficient monitoring

### Branch by Abstraction
For deeply embedded internal components (not perimeter-routable):
```
1. Create abstraction (interface) over old implementation
2. Refactor callers to use abstraction
3. Build new implementation behind same abstraction
4. Switch via feature flag
5. Remove old implementation
```

### Parallel Run
Both systems process every request simultaneously. Compare results in shadow mode.
- GitHub's "Scientist" library
- For mission-critical paths (financial calculations, pricing)
- Doubles infrastructure cost during parallel period

### Feature Flags
Runtime toggles decoupling deploy from release.
- Percentage-based rollouts (1% → 10% → 50% → 100%)
- Kill switches for instant rollback
- LaunchDarkly serves 4 billion flags/day
- **Clean up old flags** — flag debt is real

### How they work together

| Pattern | Operates at | Best for |
|---|---|---|
| Strangler Fig | Network/proxy | Well-isolated functionality via API |
| Branch by Abstraction | Code level | Deeply embedded internal components |
| Parallel Run | Validation | Mission-critical correctness verification |
| Feature Flags | Control | Gradual rollout + instant rollback |
| Anti-Corruption Layer | Data/interface | Preventing legacy concepts leaking into new code |

In practice, mature migrations use ALL of these together.

---

## 5. API Patterns

### BFF (Backend for Frontend)
Dedicated backend per client type (web, mobile, TV). Netflix pioneered.
- Each client gets exactly the data it needs
- Teams iterate independently
- Skip if single client type or GraphQL covers all needs

### API Gateway
Single entry point: auth, rate limiting, TLS, routing, caching, observability.
- Must be horizontally scalable (single point of failure risk)
- Keep thin — no business logic
- Kong, AWS API Gateway, Envoy

### API Versioning (Stripe model)
Twice-yearly major releases + monthly minor releases. Internal compatibility layer transforms old requests.
```
[Client v2024-04] → [Gateway] → [Compat Layer] → [Latest Code]
```

### GraphQL Federation
Each service owns a subgraph; gateway composes the unified supergraph.
- Independent team ownership of schema segments
- Unified API for consumers
- Apollo Router is the standard gateway

---

## 6. Modern Frontend/Edge Patterns

### Server Components (RSC)
Components execute on server, send HTML (zero JS). Can access DB directly.
- Data-heavy pages where most content is non-interactive
- Dramatically reduces JS bundle

### Islands Architecture
Static HTML page, only interactive "islands" hydrated with JS.
- Astro is the primary framework
- Best performance scores for content-heavy sites

### Micro-Frontends
Frontend split into independently deployed pieces per team.
- Module Federation (Webpack/Vite), runtime loading, or edge stitching
- Only for large organizations where monolithic frontend is the bottleneck

### Edge Computing
Logic at CDN edge nodes (Cloudflare Workers, Vercel Edge Functions).
- Auth validation, personalization, caching, SSR at the edge
- Single-digit ms latency
- Limited runtime (no full Node.js, execution time limits)

---

## 7. Decision Framework

### Start here (almost always)
- Modular Monolith + Feature Flags + Circuit Breakers + Outbox Pattern
- Covers 90% of production needs

### Add when pain forces you
| Pain | Pattern |
|---|---|
| Read/write workloads diverge | CQRS |
| Need audit trail / time-travel | Event Sourcing |
| Multiple distinct business domains with independent teams | Holonomic Systems / SCS |
| Legacy system to migrate | Strangler Fig + Branch by Abstraction |
| Distributed transactions | Saga + Outbox |
| External system integration | Anti-Corruption Layer |
| Multiple client types with different data needs | BFF |
| Latency-sensitive global users | Edge Computing |

### Evolution path
```
Monolith → Modular Monolith → SCS/Holonomic → Microservices (only if truly needed)
```

### What top companies actually ship

| Company | Stack |
|---|---|
| **Shopify** | Modular Monolith, Event-Driven, Feature Flags, Strangler Fig |
| **Netflix** | CQRS, Event Sourcing, BFF, Circuit Breaker, Canary |
| **Stripe** | API Versioning (hybrid), Idempotency Keys, Circuit Breakers, Saga |
| **Uber** | Event Sourcing (petabyte, Kafka+Flink), CQRS, Saga |
| **Slack** | CDC with Debezium, Event-Driven, Outbox |
| **Amazon** | Blue-Green, Retry+Backoff+Jitter, Bulkhead, DLQ |
