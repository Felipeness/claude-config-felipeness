---
name: sprint-archaeologist
description: Analyzes git commits, PRs, and Jira tickets from a completed sprint to surface insights that a human retrospective would miss — bug fix ratio, hot files, review load distribution, commit time patterns, and technical debt signals. Use at the end of each sprint to generate data-driven retro inputs.
---

# Sprint Archaeologist

Retros are biased by recency and who speaks loudest.
This skill analyzes what actually happened.

## Input

Provide:
- Sprint start and end dates
- Repository name(s)
- Team member names/emails (optional, for attribution)
- Jira sprint ID or label (optional)

## Data Collection

```bash
# All commits in sprint window
git log --oneline --no-merges \
  --since="[sprint_start]" --until="[sprint_end]" \
  --format="%h %ae %s"

# Files changed most during sprint
git log --since="[sprint_start]" --until="[sprint_end]" \
  --name-only --no-merges --format="" | sort | uniq -c | sort -rn | head -20

# Commit type distribution
git log --since="[sprint_start]" --until="[sprint_end]" \
  --no-merges --format="%s" | \
  grep -oE "^(feat|fix|refactor|chore|docs|test|hotfix)" | \
  sort | uniq -c | sort -rn

# Commit time distribution (detect late night / weekend work)
git log --since="[sprint_start]" --until="[sprint_end]" \
  --no-merges --format="%ae %ad" --date=format:"%H %A"
```

## Analysis Dimensions

### 1. Work Type Ratio
```
feat: X commits (new features)
fix:  Y commits (bug fixes)
refactor: Z commits
chore: W commits

Signal thresholds:
- fix > 40% → team is in maintenance mode, not delivering features
- feat > 80% → potentially skipping quality work
- refactor > 30% → planned tech debt paydown (good sign if intentional)
- hotfix > 5% → production instability — investigate
```

### 2. Hot Files (Changed > 3x in Sprint)
Files touched repeatedly in one sprint are signals:
- **Deliberate refactor**: expected, check if scoped
- **Bug magnet**: same file broken repeatedly — architectural problem
- **Feature in progress**: large feature touching same files — normal
- **Ping-pong**: feature added, then partially reverted, then re-added — design uncertainty

### 3. Review Load Distribution
```
PRs opened by each author: [distribution]
Reviews given by each author: [distribution]

Signal: if one person reviewed 80% of PRs → bus factor risk + burnout risk
Signal: if PRs have 0-1 reviewers → quality risk
```

### 4. Commit Time Patterns
```
Business hours (9h-18h): X%
Evening (18h-23h): Y%
Night (23h-6h): Z%
Weekend: W%

Signal: > 20% evening/night/weekend commits → team is overloaded
Signal: consistent late commits by one person → that person needs support
```

### 5. Cycle Time
```
PR open → merge duration average: [X hours]
PRs open > 48h without merge: [list]

Signal: PRs sitting > 48h → review bottleneck
Signal: large PRs (> 500 lines) taking > 24h → splitting problem
```

### 6. Jira vs Git Alignment (if Jira available)
```
Commits with ticket references: X%
Commits without ticket references: Y%

Signal: > 30% commits without ticket reference → invisible work
  (tech debt work not tracked, scope creep, undocumented fixes)
```

## Output: Sprint Archaeology Report

```markdown
## Sprint Archaeology Report — Sprint [N] — [dates]

### Health Score: [🟢 Healthy | 🟡 Attention Needed | 🔴 Concerning]

---

### Work Type Breakdown
| Type | Count | % | Signal |
|---|---|---|---|
| feat | [N] | [%] | [✅/⚠️ + comment] |
| fix | [N] | [%] | [✅/⚠️ + comment] |
| hotfix | [N] | [%] | [✅/⚠️ + comment] |

**Insight**: [1-2 sentence interpretation]

---

### Hot Files (changed 3+ times)
| File | Changes | Type | Signal |
|---|---|---|---|
| [file] | [N] | [bug magnet / refactor / feature] | [interpretation] |

**Insight**: [what this reveals about the codebase]

---

### Review Distribution
| Author | PRs opened | Reviews given | Balance |
|---|---|---|---|
| [name] | [N] | [N] | [⚖️ balanced / ⚠️ unbalanced] |

**Insight**: [bottlenecks or load concentration]

---

### Commit Timing
- Business hours: [%]
- After hours: [%]
- Weekend: [%]

**Insight**: [honest assessment of team load]

---

### Invisible Work Detected
Commits without ticket references: [N] ([%])
Examples: [list of commit messages that suggest untracked work]

**Insight**: [what might be hiding in the backlog]

---

### Retro Talking Points (data-backed)

**Questions to bring to retro (let the team interpret the data):**
1. "[Hot file] was changed [N] times. Is this expected or should we look at the design?"
2. "[X%] of commits were after 18h. How is everyone's workload feeling?"
3. "[Person] reviewed [N] PRs while others reviewed [Y]. Should we rebalance?"
4. "[N] commits had no ticket. Should we track this work differently?"

**Positive patterns worth naming:**
- [what went well]

**Patterns worth investigating:**
- [what the data suggests but team should interpret]
```

## Anti-Patterns to Flag Automatically

```
🔴 > 3 hotfixes in sprint         → production instability
🔴 One person > 80% of reviews    → bottleneck + bus factor
🔴 > 30% commits after 22h        → team under pressure
🟠 Same file changed 5+ times     → design problem or bug magnet
🟠 PRs without reviews merged     → process breakdown
🟡 > 20% commits without ticket   → invisible work accumulating
```
