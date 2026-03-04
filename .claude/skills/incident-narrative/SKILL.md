---
name: incident-narrative
description: Transforms raw incident data (Datadog logs, traces, alerts, Slack messages) into a readable human timeline. Use during or after an incident to build a shared understanding of what happened, in what order, and why. Accelerates post-mortem creation and RCA.
---

# Incident Narrative

Raw logs are data. A narrative is understanding. Turn one into the other.

## Input

Provide any combination of:
- Datadog log exports or log queries
- APM trace IDs
- Alert history (fired/resolved timestamps)
- Slack thread from #incidentes channel
- Error monitoring events (Sentry, Rollbar)
- Deployment timestamps

## Output: The Incident Timeline

### Format
```markdown
## Incident Timeline: [service] — [date]

### Summary
[2-3 sentence overview: what broke, who was affected, how long]

### Timeline

**[HH:MM]** — 🟡 First signal
[What the first anomaly was — latency spike, error rate, alert]
*Source: [Datadog alert / Sentry / user report]*

**[HH:MM]** — 🔴 Incident declared
[When it became clear something was wrong]
*Triggered by: [alert name / person]*

**[HH:MM]** — 🔍 Investigation begins
[First hypothesis and what was checked]

**[HH:MM]** — 📍 Root cause identified
[What was found and how]

**[HH:MM]** — 🔧 Mitigation applied
[What was done — rollback, config change, restart, scaling]

**[HH:MM]** — 🟢 Service recovered
[When metrics returned to normal]
*Total duration: [X minutes]*

---

### Root Cause
[Single clear sentence: what actually failed and why]

### Contributing Factors
- [Factor 1: e.g., missing circuit breaker]
- [Factor 2: e.g., no alerting on queue depth]

### Impact
- Users affected: [estimate or range]
- Duration: [X min from first signal to recovery]
- Data integrity: [clean / at risk / confirmed loss]
- SLA impact: [yes/no, severity]

### What Worked Well
- [Response time]
- [Communication]
- [Rollback worked cleanly]

### Action Items
| Action | Owner | Due | Priority |
|---|---|---|---|
| [fix] | [team] | [date] | P0/P1/P2 |
```

## Analysis Patterns

### Cascade Failure Pattern
```
Signal 1: [upstream] starts degrading
  ↓ [N seconds later]
Signal 2: [downstream] connection pool exhausts
  ↓ [N seconds later]
Signal 3: [client-facing] requests start timing out
  ↓ [N seconds later]
Signal 4: alerts fire (often too late)
```
Identify the root event — it's usually Signal 1 minus 2-5 minutes.

### Slow Burn Pattern
```
Week 1: error rate 0.01% (normal)
Week 2: error rate 0.05% (within threshold, ignored)
Week 3: error rate 0.2% (threshold alert, acknowledged)
Week 4: error rate 5% (incident)
```
Root cause: the condition existed for weeks. Find the Week 1 commit.

### Deploy-Induced Pattern
```
[T-0] Deploy completes
[T+2min] Error rate increases (canary signal missed)
[T+8min] Alert fires
[T+12min] Rollback initiated
[T+18min] Recovery
```
Check: was there a deploy in the 30 minutes before the incident?

## When You Don't Have Full Data

Reconstruct from what you have:
- **Only Datadog alerts**: build timeline from alert fired/resolved timestamps
- **Only Slack thread**: extract timestamps and decisions from messages
- **Only Sentry events**: use first/last occurrence + event frequency graph
- **Only logs**: grep for ERROR/WARN around the incident window, build sequence

## Anti-Patterns to Flag in Post-Mortem

During analysis, flag these if found:
- Alert fired more than 10 minutes after first anomaly signal
- Rollback took more than 15 minutes to execute
- Root cause was a known issue (existed in backlog)
- Incident affected multiple tenants due to shared resource
- No runbook existed for this failure mode
- On-call engineer learned about it from a customer, not monitoring
