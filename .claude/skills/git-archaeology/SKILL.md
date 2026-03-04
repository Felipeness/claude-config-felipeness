---
name: git-archaeology
description: Forensic analysis of git history to understand WHY code exists the way it does. Use when you encounter mysterious legacy code, God objects, or unusual patterns and need to understand the decisions, incidents, and pressures that created them before touching anything.
---

# Git Archaeology

Before you change code you don't understand, understand why it exists. Every weird pattern has a story. Find it.

## Process

### 1. Gather the Evidence
```bash
# Who touched this file and when?
git log --follow --oneline -30 <file>

# Full context of each commit
git log --follow -p --no-merges <file>

# Who wrote which lines (including renames)
git blame --follow <file>

# Find the commit that introduced a specific line
git log -S "suspicious_function_name" --oneline

# PRs and issues mentioned in commits
git log --follow --oneline <file> | grep -E "#[0-9]+"
```

### 2. Build the Timeline
For each significant commit found, reconstruct:
- **What changed**: the actual diff
- **Why it changed**: commit message, PR description, linked issue
- **Context**: what was happening in the codebase around that time (`git log --oneline --since=<date> --until=<date>`)
- **Who decided**: author + reviewers if PR is linkable

### 3. Classify the Origin
| Pattern | Likely cause |
|---|---|
| Sudden growth spike in one commit | Incident hotfix under pressure |
| Many small commits over months | Gradual scope creep |
| Reverted and re-applied | Controversial decision, multiple attempts |
| Committed late Friday night | Emergency fix, treat with extra care |
| Multiple authors in same week | Major refactor or fire drill |
| Comment says "DO NOT TOUCH" | Past trauma — find the incident |

### 4. Investigate Linked Context
```bash
# If commit references a PR number (#123)
gh pr view 123 --comments   # read the full discussion

# If commit references a Jira ticket (PROJ-456)
# Search Jira for context, team decisions, client pressures

# Find related changes in the same period
git log --oneline --all --since="2023-01-01" --until="2023-01-31" --no-merges
```

### 5. Produce the Archaeology Report

```markdown
## Archaeology Report: [file/function name]

### What it does today
[brief description of current behavior]

### Origin (when and why it was created)
[commit hash, date, context]

### Key evolution moments
- [date]: [what changed and why]
- [date]: [incident/feature that caused growth]
- [date]: [attempted fix or refactor]

### Why it looks like this
[the actual reason — incident, technical debt, conscious decision]

### Risk assessment
- Safe to change: [yes/no/with caution]
- Tests that would catch regressions: [list]
- People to consult: [git blame authors still on team]
- Hidden dependencies discovered: [list]

### Recommended approach
[refactor now / leave alone / document / rewrite with new tests]
```

## Red Flags to Investigate

- `// TODO: fix this properly` older than 6 months
- Functions named `doThingNew`, `doThingV2`, `doThingFinal`
- Commented-out blocks of code (what were they doing?)
- Magic numbers with no explanation
- `catch (e) {}` empty catches (something failed silently here)
- Files with 0 tests but heavy usage
- Imports from unexpected modules (tight coupling that shouldn't exist)

## Anti-Patterns

- **Changing without investigating**: the mystery pattern is usually load-bearing
- **Trusting only the last commit**: the real reason is often 10 commits back
- **Ignoring merge commits**: PR merge commits link to full discussions
- **Skipping the blame**: the author is still there 60% of the time — ask them
