---
name: oncall-academy
description: Generates realistic on-call training simulations based on real incident patterns from your system. Trains engineers before their first on-call shift through interactive "what would you do?" scenarios. Like a flight simulator, but for production incidents.
---

# On-Call Academy

Don't let someone's first real incident also be their first practice.
This skill creates the practice.

## Purpose

A new engineer's first on-call experience shouldn't be their first time thinking through:
- Which runbook applies?
- Who do I escalate to?
- Is this a real incident or a false alarm?
- Do I rollback or keep investigating?

This skill generates training scenarios based on your system's actual incident history and architecture.

## Simulation Structure

### Format: The Pager Goes Off

Each simulation starts with an alert and unfolds based on the trainee's responses.

```markdown
## Scenario: [Name]
**Difficulty**: [Junior | Mid | Senior]
**System**: [service name]
**Time**: [weekday 14:00 | Friday 23:45 | Saturday 03:00]  ← context matters

---

### 🚨 Alert Received

**PagerDuty alert:**
> [Service] error rate exceeded threshold
> Error rate: 4.7% (threshold: 1%)
> Affected service: echo-atende-backend
> Time: 23:47

**Datadog link shows:**
> - Error rate spiking since 23:40
> - Latency p99: 8.2s (normal: 400ms)
> - No deployment in last 4h
> - MongoDB connection errors in logs

---

### What do you do first?

A) Check if there's an active incident already declared
B) Immediately rollback the last deployment
C) Look at the MongoDB metrics in Datadog
D) Wake up the tech lead

---

*[Best answer: A — always check if someone else already knows first.
Then C to understand the scope before acting.
B is wrong — there was no recent deploy.
D is premature — investigate first.]*

---

### 🔍 Investigation Continues...

You check Datadog. MongoDB connection pool shows:
- Active connections: 10/10 (pool exhausted)
- Queued connections: 847
- Slowest query: 45s avg (normal: 20ms)
  Location: src/services/report.service.ts — generateReport()

A new batch job was triggered at 23:38 by a large tenant.

---

### What do you do?

A) Kill the batch job process
B) Increase the MongoDB connection pool size
C) Alert the tenant and ask them to stop
D) Scale up the number of app pods

---

*[Best answer: A — the batch job is the cause. Kill it to immediately free connections.
D is wrong — more pods compete for the same exhausted pool.
B is wrong — takes time and doesn't fix the immediate problem.
C is wrong — too slow, users are impacted now.]*

---

### Resolution

After killing the batch job:
- Connection pool drains within 30s
- Error rate drops to 0.1% within 2 minutes
- Latency returns to normal within 5 minutes

**Incident declared resolved at 00:04.**

---

### Debrief

**What happened**: Unthrottled batch job exhausted the shared MongoDB connection pool.

**What you handled well**: [based on trainee's choices]

**What to improve**: [based on trainee's choices]

**Runbook gap identified**: No runbook for "MongoDB pool exhaustion" — create one.

**Follow-up actions**:
- Add per-tenant rate limiting on report generation
- Add alert: "MongoDB pool > 80% utilization"
- Add query timeout for batch operations (5s max)
```

## Scenario Library

### Beginner Scenarios
1. **False Alarm** — alert fires, everything is actually fine (teaches: verify before escalating)
2. **Post-Deploy Regression** — error rate increases after deploy (teaches: rollback decision)
3. **Disk Full** — simple resource exhaustion (teaches: basic diagnosis)

### Intermediate Scenarios
4. **Cascade Failure** — Redis down → sessions fail → auth fails → full outage (teaches: trace the cascade)
5. **Noisy Tenant** — one tenant's batch job impacts all others (teaches: isolation)
6. **Gradual Memory Leak** — memory grows slowly over days until OOM (teaches: metrics over time)

### Advanced Scenarios
7. **Data Corruption** — partial write failure leaves inconsistent state (teaches: incident severity, escalation)
8. **Multi-Region Incident** — one region degraded, others fine (teaches: traffic failover)
9. **Dependency Outage** — Twilio/Stripe/PIX provider returns 503 (teaches: graceful degradation)
10. **Security Incident** — abnormal auth patterns detected (teaches: security response playbook)

## Simulation Configuration

To generate a custom scenario, provide:
```
Service: [service name]
Incident pattern: [based on past incident or known risk]
Engineer level: [junior / mid / senior]
Time: [business hours / evening / 3am weekend]
Twist: [optional — e.g., "the usual runbook doesn't apply this time"]
```

## Evaluation Rubric

| Decision Point | Ideal Response | Common Mistake | Why It Matters |
|---|---|---|---|
| First action | Assess before acting | Immediate rollback | Rollback may not fix the cause |
| Escalation timing | After 15min investigation | Never escalate | Some incidents need more eyes |
| Communication | Update status page early | Wait until fixed | Users are already affected |
| Root cause | Confirm before closing | Close on symptom fix | Problem will recur |

## Debrief Template

After each simulation:

```markdown
### Your Decisions
[replay of each choice made]

### What Went Well
- [specific good decision + why it was correct]

### What to Practice
- [specific mistake + what to do differently]

### Time to Resolution
- Your path: [X minutes]
- Optimal path: [Y minutes]
- Real incident (if applicable): [Z minutes]

### Runbooks to Review Before Your First Shift
- [ ] [runbook name]: covers [scenario type]
- [ ] [runbook name]: covers [scenario type]
```
