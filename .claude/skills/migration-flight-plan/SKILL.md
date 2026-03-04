---
name: migration-flight-plan
description: Structured flight plan for any migration — database schema, service replacement, library upgrade, or infrastructure change. Generates pre-flight checklist, go/no-go criteria, monitoring checkpoints, rollback triggers, and post-migration validation. Inspired by aviation checklists — you don't take off without completing every item.
---

# Migration Flight Plan

Migrations fail not because the plan was wrong, but because there was no plan.
This skill generates one before you execute anything.

## Input

Describe the migration:
- What is being migrated? (DB schema, service, library, infrastructure)
- Source state and target state
- Estimated data volume or traffic impact
- Migration window (live / maintenance / rolling)

## Flight Plan Structure

### Pre-Flight Checks (T-48h to T-1h)
Everything that must be true before starting. If any item fails, abort.

```markdown
### Pre-Flight Checklist

**Backups**
- [ ] Full backup completed and verified (restore tested, not just taken)
- [ ] Backup timestamp: [YYYY-MM-DD HH:MM]
- [ ] Backup location: [S3 path or server]
- [ ] Estimated restore time: [X minutes]

**Environment**
- [ ] Migration tested in HML with production-like data volume
- [ ] HML test result: [pass/fail + notes]
- [ ] Estimated migration duration: [X minutes at production scale]
- [ ] Migration window confirmed: [start time — end time]

**Rollback Readiness**
- [ ] Rollback procedure written and reviewed
- [ ] Rollback tested in HML
- [ ] Rollback time estimated: [X minutes]
- [ ] Who executes rollback: [person]

**Dependencies**
- [ ] Downstream services notified (if any downtime)
- [ ] Feature flags configured to disable affected features during migration
- [ ] On-call engineer confirmed available for window
- [ ] Runbook link: [URL]

**Go/No-Go Criteria** (check all before proceeding)
- [ ] Error rate < 0.1% for 30min before migration starts
- [ ] No active incidents in progress
- [ ] All pre-flight items checked
- [ ] At least 2 engineers available (primary + backup)
```

### Ignition (T-0: Migration Start)

```markdown
### Migration Execution

**T+0:00** Start migration
- Command/action: [exact command or script]
- Expected output: [what success looks like]
- First checkpoint: T+[X]min

**T+[X]:00** Checkpoint 1: [milestone]
- Verify: [what to check]
- Expected state: [description]
- ⚠️ Abort if: [condition]

**T+[X]:00** Checkpoint 2: [milestone]
- Verify: [what to check]
- ⚠️ Abort if: [condition]

**T+[X]:00** Migration complete
- Run validation queries/tests
- Expected result: [description]
```

### Go/No-Go Gates

Define explicit decision points. At each gate, you either proceed or abort.

| Gate | Checkpoint | Proceed if | Abort if |
|---|---|---|---|
| Gate 1 | [milestone] | [success condition] | [failure condition] |
| Gate 2 | [milestone] | [success condition] | [failure condition] |
| Final gate | [completion] | [validation passes] | [any validation fails] |

### Rollback Triggers (automatic abort conditions)

```markdown
Abort and rollback immediately if:
- [ ] Migration duration exceeds [2x estimated time]
- [ ] Error rate exceeds [1%] during migration
- [ ] Database connections exhausted
- [ ] Any data validation check fails
- [ ] Customer-facing errors detected
- [ ] Primary engineer loses access to systems

Rollback procedure:
1. [Step 1]
2. [Step 2]
3. Verify rollback: [command/check]
4. Notify team: [channel]
```

### Post-Migration Validation (T+0 to T+60min)

```markdown
**Immediate (T+0 to T+5min)**
- [ ] [critical check 1 — data integrity]
- [ ] [critical check 2 — service health]
- [ ] Error rate still < 0.1%

**Short-term (T+5 to T+30min)**
- [ ] [business logic check — e.g., payments processing correctly]
- [ ] [performance check — response times within baseline]
- [ ] No anomalies in Datadog dashboards

**Stable (T+30 to T+60min)**
- [ ] All automated tests pass
- [ ] No increase in support tickets
- [ ] Feature flag re-enabled (if disabled during migration)
- [ ] Migration declared complete and communication sent

**Watch for 24h**
- [ ] [metric to monitor]
- [ ] Alert threshold: [value]
```

## Templates by Migration Type

### Database Schema Migration
```
Pre-flight additions:
- [ ] Schema migration is backward compatible (no column drops)
- [ ] Migration runs in < 30s on production table size
- [ ] No full table locks (use CONCURRENT index creation)
- [ ] Application deployed with compatibility layer first

Rollback: reverse migration script prepared and tested
```

### Service Replacement (Strangler Fig)
```
Pre-flight additions:
- [ ] Traffic proxy tested in HML (route X% to new service)
- [ ] Both services running in parallel and verified
- [ ] Monitoring shows equivalent behavior between old and new

Rollback: route 100% traffic back to old service (1 config change)
```

### Library/Dependency Upgrade
```
Pre-flight additions:
- [ ] Breaking changes reviewed (changelog)
- [ ] All usages updated and tested
- [ ] Performance benchmarks compared (before/after)

Rollback: revert package.json/go.mod and redeploy previous version
```

### Infrastructure Migration (K8s, Redis, DB cluster)
```
Pre-flight additions:
- [ ] New infrastructure running in parallel
- [ ] Data sync verified (replication lag < 1s)
- [ ] DNS TTL reduced 24h before cutover (for fast rollback)

Rollback: point DNS/config back to old infrastructure
```
