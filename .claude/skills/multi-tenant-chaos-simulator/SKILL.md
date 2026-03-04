---
name: multi-tenant-chaos-simulator
description: Simulates failure scenarios specific to multi-tenant SaaS systems — tenant isolation breaches, noisy-neighbor effects, cross-tenant cache poisoning, shared resource exhaustion, and event routing failures. Use when reviewing code that touches shared infrastructure or tenant boundaries.
---

# Multi-Tenant Chaos Simulator

In a single-tenant system, failures are isolated.
In a multi-tenant system, one bad tenant can take everyone down — or worse, see everyone's data.

## Simulation Scenarios

### 1. Noisy Neighbor — Database
*Tenant A runs an expensive query. What happens to Tenant B?*

```
Scenario: Tenant A executes:
  db.contracts.aggregate([
    { $unwind: "$payments" },
    { $lookup: { from: "invoices", ... } }
  ])
  — full collection scan, 500k documents, no tenant index

Questions to answer:
- Does this query use tenant index or scan all tenants' data?
- Is there a query timeout configured per connection?
- Is the connection pool shared across tenants?
  (If yes: 10 connections exhausted by A → B starts queueing)
- Is there read concern that isolates impact to replicas?
- Would Datadog alert before B's users notice degradation?
```

**Code to check**:
```typescript
// ❌ Dangerous: query without tenant index
const contracts = await Contract.find({ status: 'active' })

// ✅ Safe: tenant always first in query, index covers it
const contracts = await Contract.find({
  tenantId: session.tenantId,  // indexed first
  status: 'active'
})
```

### 2. Cache Poisoning — Redis
*Tenant A's data ends up in Tenant B's cache key*

```
Scenario: Two tenants with ID "123" and "1234"

Bug: cache key is `user:${userId}` without tenant prefix
  Tenant 123  stores: user:456  → { name: "João Silva", role: "admin" }
  Tenant 1234 reads: user:456  → gets João Silva's data

Questions:
- Are all Redis cache keys namespaced by tenantId?
- Is the key pattern documented and consistently applied?
- What's the TTL? (longer TTL = longer data leak window)
```

**Check pattern**:
```typescript
// ❌ Key collision risk
const cacheKey = `user:${userId}`

// ✅ Tenant-namespaced key
const cacheKey = `tenant:${tenantId}:user:${userId}`
```

### 3. Event Routing Failure
*Webhook or event delivered to wrong tenant*

```
Scenario: Payment provider sends webhook to shared endpoint
  payload: { paymentId: "pay_123", amount: 5000 }
  — no tenantId in payload

Questions:
- How does the system know which tenant this payment belongs to?
- Is there a lookup by paymentId before processing?
- What happens if paymentId exists in two tenants?
- Is the event idempotent? Can it be delivered twice?

Worst case: payment credited to wrong tenant
```

**Check pattern**:
```typescript
// ❌ Assumes tenantId from payload (can be spoofed or missing)
async handleWebhook(body: WebhookPayload) {
  const tenantId = body.metadata?.tenantId
  await creditAccount(tenantId, body.amount)
}

// ✅ Lookup tenant from verified external ID
async handleWebhook(body: WebhookPayload) {
  const payment = await paymentRepo.findByExternalId(body.paymentId)
  if (!payment) throw new Error('Unknown payment')
  await creditAccount(payment.tenantId, body.amount) // tenantId from DB, not payload
}
```

### 4. Shared Queue Starvation
*Tenant A floods the queue, blocking Tenant B*

```
Scenario: Tenant A triggers 10,000 email sends in a loop
  All go to the shared RabbitMQ queue
  Tenant B's password reset email queued after 10,000 A messages
  User B waits 45 minutes for password reset

Questions:
- Is the queue shared across all tenants?
- Is there per-tenant rate limiting on queue publishes?
- Is there a priority queue for time-sensitive operations?
- What's the dead letter queue behavior?
```

**Mitigation patterns**:
```
- Per-tenant queue (overkill but fully isolated)
- Fair queuing: round-robin across tenants
- Priority lanes: critical (auth, payments) separate from bulk (email, exports)
- Rate limiting per tenant: max N messages/second
```

### 5. Horizontal Pod Autoscaling During Spike
*One tenant's traffic spike triggers scale-up, impacting all tenants during startup*

```
Scenario: Tenant A (large condominio) imports 50k units at 9h AM
  CPU spikes to 95%
  HPA triggers: 3 pods → 6 pods
  During scale-up (60s): only 3 pods available, handling double load
  Other tenants experience elevated latency during scale-up window

Questions:
- Is there predictive scaling for known large tenants?
- Is HPA target CPU low enough (60-70%) to allow headroom?
- Are tenant quotas enforced to prevent single-tenant traffic spikes?
```

### 6. Schema Migration Race Condition
*Running a migration while multi-tenant traffic is live*

```
Scenario: Add NOT NULL column to contracts table
  Migration starts, adds column with NULL default
  App code deployed expecting column to exist
  But: some pods still running old code, some new
  Old pods insert rows without new column (NULL value)
  New code reads NULL and throws exception for those tenants

Questions:
- Is the migration backward compatible with the currently running app?
- Was the 3-phase migration pattern used?
  Phase 1: add column with NULL allowed, deploy app
  Phase 2: backfill, add NOT NULL constraint
  Phase 3: remove compatibility code
```

## Output: Chaos Simulation Report

```markdown
## Multi-Tenant Chaos Simulation: [component/PR]

### Scenarios Tested
| Scenario | Risk Level | Current Behavior | Gap |
|---|---|---|---|
| Noisy Neighbor (DB) | 🔴 High | No query timeout | Add 5s timeout |
| Cache Poisoning | 🟢 Low | Keys namespaced | None |
| Event Routing | 🟡 Medium | tenantId from payload | Verify from DB |
| Queue Starvation | 🟠 High | Shared queue, no limits | Add rate limiting |

### 🔴 Tenant Isolation Risks Found
[List any scenario where Tenant A could affect Tenant B's data or experience]

### 🟡 Performance Risks Found
[List noisy-neighbor or resource contention scenarios]

### Recommended Fixes (in priority order)
1. [Most critical fix]
2. [Second fix]

### Tests to Add
- [ ] Test: queries always include tenantId filter
- [ ] Test: cache keys are tenant-scoped
- [ ] Test: events are not processable with wrong tenant context
```
