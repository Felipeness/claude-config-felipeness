---
name: deployment-risk-score
description: Pre-deployment risk assessment that scores a PR/diff before merging. Analyzes files changed, test coverage delta, deployment timing, module criticality, and cross-service impact. Use before any production deploy to get a structured risk verdict. Inspired by Meta's Diff Risk Score (DRS).
---

# Deployment Risk Score

Not all deploys are equal. Score the risk before it scores you.

## Input

Provide one or more of:
- PR number or diff to analyze
- List of files changed
- Deployment time and day
- Service name and environment

## Scoring Dimensions

### 1. Change Surface (0-25 pts)
```
Files changed:
  1-3 files      → 5 pts
  4-10 files     → 10 pts
  11-20 files    → 18 pts
  20+ files      → 25 pts

Lines changed:
  <50 lines      → 2 pts
  50-200 lines   → 8 pts
  200-500 lines  → 15 pts
  500+ lines     → 20 pts
```

### 2. Module Criticality (0-25 pts)
Rate each file changed by criticality:
```
Critical path (payment, auth, billing, data export)  → 25 pts each
High (webhooks, API endpoints, database models)       → 15 pts each
Medium (services, utilities, config)                  → 8 pts each
Low (tests, docs, UI components, types)               → 2 pts each

Score = max criticality of any single file changed
```

### 3. Test Coverage Delta (0-20 pts)
```
Tests added > code added         → 0 pts (green)
Tests added = code added         → 5 pts
Code added, few tests            → 12 pts
Code added, no tests             → 20 pts
Tests deleted without replacement → 20 pts
```

### 4. Deployment Context (0-15 pts)
```
Time of day:
  Business hours (9h-17h)        → 2 pts
  Evening (17h-22h)              → 8 pts
  Night/weekend                  → 15 pts

Day of week:
  Mon-Thu                        → 0 pts
  Friday                         → 8 pts (never deploy on Friday)
  Weekend                        → 12 pts
```

### 5. Recent Activity Risk (0-15 pts)
```bash
# Check recent changes to same files
git log --oneline --since="7 days ago" -- <changed_files>

0 recent changes                 → 0 pts
1-2 changes in last 7 days       → 5 pts
3+ changes in last 7 days        → 10 pts (hot file)
Reverted in last 30 days         → 15 pts (historically unstable)
```

## Final Score & Verdict

| Score | Risk Level | Recommendation |
|---|---|---|
| 0-20 | 🟢 Low | Deploy freely |
| 21-40 | 🟡 Medium | Deploy with monitoring dashboard open |
| 41-60 | 🟠 High | Deploy with rollback plan ready, notify team |
| 61-80 | 🔴 Very High | Deploy only in business hours, staged rollout |
| 81+ | ⛔ Critical | Defer or split into smaller PRs |

## Output Format

```markdown
## Deployment Risk Score: PR #[number]

**Total Score: [X]/100 — [Risk Level]**

### Breakdown
| Dimension | Score | Notes |
|---|---|---|
| Change Surface | X/25 | [N files, N lines] |
| Module Criticality | X/25 | [highest risk file] |
| Test Coverage | X/20 | [delta analysis] |
| Deploy Context | X/15 | [day + time] |
| Recent Activity | X/15 | [N changes in 7d] |

### Risk Factors Identified
- [specific concern 1]
- [specific concern 2]

### Mitigations Required Before Deploy
- [ ] [action item]
- [ ] [action item]

### Rollback Plan
[specific rollback steps for this change]

### Monitoring Checkpoints (first 30 min post-deploy)
- [ ] [metric to watch]
- [ ] [alert threshold]
```

## Automatic Flags (override score to Critical regardless of total)

- Payment processing code changed without integration tests
- Auth/session code changed
- Database schema migration included
- Environment variable added without documentation
- Third-party API client changed (Twilio, Stripe, PIX provider)
- Multi-tenant isolation code touched
