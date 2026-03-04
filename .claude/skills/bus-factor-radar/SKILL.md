---
name: bus-factor-radar
description: Analyzes git history to map knowledge concentration across the codebase — identifies modules with single contributors, orphaned code, and knowledge silos. Produces a bus factor report that quantifies team resilience and flags specific risks. Use quarterly or when planning team changes.
---

# Bus Factor Radar

Bus factor = how many people need to get hit by a bus before a module becomes unmaintainable.
The target is always ≥ 2. Anything below is a risk.

## Data Collection

```bash
# Contributors per file (last 12 months)
git log --since="12 months ago" --format="%ae" -- <file> | sort -u | wc -l

# Top contributor % per file
git log --since="12 months ago" --format="%ae" -- <file> | sort | uniq -c | sort -rn

# Files with only 1 unique contributor
git log --since="12 months ago" --format="%ae %H" --name-only | awk '...'

# Who knows this module best (by commit count)
git shortlog --since="12 months ago" -sn -- <directory>/

# Files no one has touched in 12+ months
git log --before="12 months ago" --format="%H" -- <path> | head -1
```

## Bus Factor Categories

### 🔴 Critical (Bus Factor = 1)
One person is the only author of significant commits in the last 12 months.
**Risk**: If they leave, the module is effectively a black box.

### 🟠 High (Bus Factor = 2, one person > 80% of commits)
Two contributors, but one owns nearly everything.
**Risk**: The second contributor may not have deep enough context.

### 🟡 Medium (Bus Factor = 2-3, balanced)
Multiple contributors but still limited coverage.
**Risk**: Manageable but should be documented.

### 🟢 Low (Bus Factor ≥ 3, balanced distribution)
Knowledge is distributed. No single point of failure.

## Analysis Dimensions

### By Module/Directory
```
src/payments/          → Bus Factor: 1 (joão.silva, 94% of commits)
src/auth/              → Bus Factor: 3 (distributed evenly)
src/webhooks/          → Bus Factor: 2 (one author 75%)
packages/webhook-gateway/ → Bus Factor: 1 (legacy, original author left)
```

### By Criticality × Bus Factor (Risk Matrix)
```
                High Criticality | Low Criticality
Bus Factor 1  |   🔴 CRITICAL    |   🟡 Medium
Bus Factor 2  |   🟠 High        |   🟢 Low
Bus Factor 3+ |   🟢 Low         |   🟢 Low
```

Critical path modules (auth, payments, billing) with Bus Factor 1 = highest priority.

### Orphaned Code
Files not modified in 12+ months by anyone currently on the team:
```bash
# Find files last touched by someone no longer in git log recent authors
git log --format="%ae" --since="6 months ago" | sort -u > active_authors.txt
git log --before="12 months ago" --format="%ae %f" | grep -v -f active_authors.txt
```

## Output: Bus Factor Report

```markdown
## Bus Factor Report — [Repository] — [Date]

### Executive Summary
- Modules analyzed: [N]
- 🔴 Critical (BF=1, high criticality): [N modules]
- 🟠 High risk (BF=2, imbalanced): [N modules]
- 🟡 Medium risk: [N modules]
- 🟢 Healthy (BF≥3): [N modules]

### Critical Risks

#### `src/payments/`
- **Bus Factor**: 1
- **Sole author**: [name/email]
- **Last active**: [date]
- **Still on team**: [yes/no]
- **Commits in last year**: [N]
- **Why it matters**: Payment processing — any bug here affects revenue
- **Recommended action**: Pair programming sessions + documentation sprint

#### `packages/webhook-gateway/`
- **Bus Factor**: 1
- **Sole author**: [original author — left company]
- **Knowledge gap**: High — no one has deep context
- **Recommended action**: Archaeology session + rewrite plan

### Knowledge Heat Map
[List modules ordered by risk score = criticality × (1/bus_factor)]

### Recommended Actions by Priority

**P0 — Address in next sprint:**
- [ ] [module]: schedule knowledge transfer sessions with [author]
- [ ] [module]: write architecture doc before [author] goes on vacation

**P1 — Address this quarter:**
- [ ] [module]: pair programming rotation to spread knowledge
- [ ] [module]: add tests as documentation for unknown code

**P2 — Monitor:**
- [ ] [modules with BF=2]: continue monitoring, set up alerts if contributor leaves

### Authors at Risk of Becoming Bus Factors
[Authors who are the sole contributor to 3+ modules — if they leave, multiple modules go dark]
```

## Prevention Practices to Recommend

- **Pair programming rotation** on high-criticality, low-BF modules
- **Architecture docs** for every module with BF=1
- **Code review from second owner** — always assign reviews to the non-primary author to build context
- **Bus factor clause in offboarding** — before anyone leaves, run this report and schedule knowledge transfer
