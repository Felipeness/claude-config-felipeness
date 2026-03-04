---
name: codebase-time-capsule
description: Writes a "letter to future developers" about the current state of a module or service — what works, what's fragile, the traps that aren't documented, and the decisions that made sense at the time. Updated quarterly. Creates a living diary of technical context.
---

# Codebase Time Capsule

Code doesn't come with memories. This skill creates them.

## Purpose

A time capsule captures what no README covers:
- The things that look weird but exist for good reasons
- The things that look fine but are actually fragile
- The decisions that made sense given the constraints at the time
- The experiments that were tried and abandoned
- The warnings that experienced devs carry in their heads

## When to Write One

- Before a developer who owns critical knowledge leaves or goes on extended leave
- After a major incident that revealed hidden fragility
- When onboarding a new engineer to a complex module
- Quarterly review of high-criticality services
- When refactoring something ancient

## Input

Provide:
- Module/service name
- Key files and their purpose
- Recent incidents or pain points
- Known technical debt
- Anything you'd tell someone before they touch this code

## Output Format

```markdown
# Time Capsule: [Service/Module Name]
**Written**: [Date]
**Author**: [Name]
**Next review**: [Date + 3 months]

---

## What This Does (in plain language)

[Explain what this code does as if explaining to a smart person who has never seen it.
Not the official description — the real explanation.]

---

## What Works Well

[Honest assessment of the parts you're proud of or that have proven reliable]

- [Feature/pattern]: [why it works and should be kept]
- [Design decision]: [why it was the right call]

---

## What's Fragile (Handle With Care)

[The parts that could break if you're not careful — and how to be careful]

### [Component/File/Pattern]
**Why it's fragile**: [the actual reason]
**What breaks it**: [specific conditions or changes that cause failure]
**Warning signs**: [how to know it's about to break]
**How to touch it safely**: [the right approach]

---

## The Traps

[Things that look innocent but will hurt you]

### Trap 1: [Name]
**What it looks like**: [the innocent-looking code or pattern]
**What actually happens**: [the non-obvious consequence]
**How we learned this**: [incident, debugging session, etc.]

### Trap 2: [Name]
[same format]

---

## Decisions That Look Wrong But Aren't

[The "why did they do it this way?" patterns with explanations]

### [Pattern/Code that looks questionable]
**Why it exists**: [the real reason — incident, constraint, deliberate tradeoff]
**What we tried instead**: [alternatives that failed]
**When to change it**: [conditions under which this should be reconsidered]

---

## The Experiments Graveyard

[Things that were tried and abandoned — so no one tries them again]

| What was tried | Why it failed | Date | Commit/PR |
|---|---|---|---|
| [approach] | [reason] | [date] | [link] |

---

## Incidents This Service Has Caused

[Brief reference to past incidents — so the next person has context]

| Date | What happened | Root cause | Fix applied |
|---|---|---|---|
| [date] | [brief description] | [root cause] | [fix] |

---

## If You're About to Refactor This

Before you change anything:
1. [Specific thing to understand first]
2. [Test you must have green before and after]
3. [Person to talk to]
4. [Dependency you might not know about]

---

## If This Starts Misbehaving

[Quickstart diagnosis guide based on actual past incidents]

**First, check:**
1. [Most likely cause based on history]
2. [Second most likely cause]

**Useful queries/commands for debugging this service:**
```bash
# [description]
[command]
```

---

## What I Wish I'd Known When I Started

[The one paragraph you'd write to yourself on day 1 of owning this]

---

## Change Log
| Date | What changed | Author |
|---|---|---|
| [date] | Initial capsule written | [name] |
| [date] | Updated after [incident/refactor] | [name] |
```

## Maintenance

Time capsules expire. Review and update:
- After any production incident involving this service
- After any significant refactor
- When the primary owner changes
- Quarterly, even if nothing changed ("still accurate as of [date]")

An outdated time capsule that says "still valid as of [date]" is better than a silent one.
