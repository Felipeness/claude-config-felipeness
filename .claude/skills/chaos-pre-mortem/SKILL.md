---
name: chaos-pre-mortem
description: Pre-deployment failure simulation — before merging, systematically asks "what breaks if X fails?" for every critical dependency in the changed code. Produces a resilience report with gaps and required mitigations. Think of it as a fire drill before the fire.
---

# Chaos Pre-Mortem

An incident that you anticipated is not an incident — it's a test. Run this before every significant deploy.

## Process

### Step 1: Map Dependencies
From the changed code, identify all runtime dependencies:
```
Changed service → dependencies to test:
  HTTP calls        → downstream services
  DB queries        → MongoDB / PostgreSQL
  Cache reads       → Redis
  Queue publishes   → RabbitMQ / SQS
  Workflow calls    → Temporal
  External APIs     → Twilio, Stripe, PIX provider, Arbo
  File operations   → S3 / local disk
```

### Step 2: Run Failure Scenarios

For each dependency, simulate these failure modes:

#### Latency Degradation
*"What if [dependency] responds in 5s instead of 50ms?"*
- Does the caller have a timeout configured?
- Does the timeout cascade to the user request?
- Is there a circuit breaker that would open?
- Would concurrent slow requests exhaust the connection pool?

#### Complete Outage
*"What if [dependency] returns connection refused for 10 minutes?"*
- Does the service degrade gracefully or crash?
- Are there fallbacks or cached values?
- Does the health check correctly report degraded?
- Does it recover automatically when the dependency comes back?

#### Partial Failure
*"What if [dependency] returns 500 for 20% of requests?"*
- Are retries configured with backoff?
- Do retries cause retry storms upstream?
- Are idempotency keys set so retries are safe?

#### Bad Data
*"What if [dependency] returns malformed or unexpected data?"*
- Is the response validated before use?
- Does invalid data propagate and corrupt other state?
- Are errors caught and handled or do they bubble up as 500s?

#### Multi-tenant Impact
*"If tenant A's request causes this failure, does it affect tenant B?"*
- Are connection pools shared across tenants?
- Is the queue shared? Could one tenant's backlog block others?
- Are rate limits per-tenant or global?

### Step 3: Resilience Report

```markdown
## Chaos Pre-Mortem: [PR/Service] — [date]

### Dependencies Tested
[list of dependencies identified in changed code]

### Scenario Results

#### [Dependency]: MongoDB
| Scenario | Current behavior | Gap | Required mitigation |
|---|---|---|---|
| 5s latency | Request times out after 30s | ❌ Too slow | Add 3s query timeout |
| Complete outage | Service crashes | ❌ No fallback | Add circuit breaker |
| Replica lag 30s | Reads stale data | ⚠️ Acceptable | Document in runbook |

#### [Dependency]: Redis
| Scenario | Current behavior | Gap | Required mitigation |
|---|---|---|---|
| Eviction under memory pressure | Cache miss, hits DB | ✅ Handled | None |
| Connection refused | Session reads fail, 500 returned | ❌ | Add in-memory fallback for session |

### 🔴 Blocking Gaps (must fix before deploy)
- [gap 1]
- [gap 2]

### 🟡 Acceptable Risks (document and monitor)
- [risk 1 + monitoring plan]

### ✅ Well-Handled Scenarios
- [what already works correctly]

### Runbook Additions Required
- [ ] Add scenario: [X fails] → do [Y]
- [ ] Add alert: [metric] > [threshold]
```

## Failure Scenarios by Service Type

### Node.js / Express APIs
- What happens when MongoDB connection pool is exhausted (all 10 connections busy)?
- What if a request handler throws an unhandled promise rejection?
- What if `NODE_OPTIONS --max-old-space-size` is hit mid-request?
- What if the process receives SIGTERM during request processing?

### Temporal Workflows
- What if an activity times out after `StartToCloseTimeout`?
- What if the Temporal server is unreachable when starting a workflow?
- What if an activity succeeds but the workflow crashes before recording the result?
- What if a compensating transaction also fails during saga rollback?

### Socket.IO
- What if a Redis pub/sub message is lost during failover?
- What if a client reconnects to a different pod than the one holding its session state?
- What if 1000 clients reconnect simultaneously after a brief outage?

### RabbitMQ Consumers
- What if the consumer crashes mid-processing (message already acked)?
- What if the DLQ fills up and stops accepting messages?
- What if the same message is delivered twice (at-least-once delivery)?

## Quick Reference: Common Gaps

| Gap | Fix |
|---|---|
| No timeout on external call | Add `AbortController` with timeout |
| No circuit breaker | Use `opossum` (Node) or `go-circuit-breaker` |
| No retry with backoff | Use `p-retry` (Node) or Temporal retry policy |
| Shared pool affects multiple tenants | Add per-tenant connection limits |
| No graceful shutdown | Handle `SIGTERM`, drain in-flight requests |
| Silent errors | Add `process.on('unhandledRejection')` handler |
