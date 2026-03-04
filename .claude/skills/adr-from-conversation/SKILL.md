---
name: adr-from-conversation
description: Converts a technical discussion (Slack thread, PR comments, meeting notes, or chat transcript) into a structured Architecture Decision Record (ADR). Preserves institutional knowledge that would otherwise die in threads. Use after any significant technical decision is made.
---

# ADR from Conversation

Good decisions made poorly documented are decisions that will be made again in 6 months.
This skill turns a conversation into a record.

## Input

Paste any of:
- Slack thread export
- PR discussion comments
- Meeting notes or transcript
- Chat conversation
- Email thread

## Process

### 1. Extract the Signal
From the raw conversation, identify:
- **The question being decided**: what was the actual choice?
- **Options discussed**: what alternatives were considered?
- **Arguments made**: the reasoning on each side
- **Decision reached**: what was chosen (or if it's still open)
- **Key participants**: who had domain knowledge / made the call

### 2. Fill Gaps
If the conversation is ambiguous, ask:
- What problem were they solving? (the "why")
- What would have happened with each alternative?
- Were there constraints not explicitly mentioned? (deadline, budget, team skill)
- Is this reversible or hard to change later?

### 3. Generate the ADR

```markdown
# ADR-[number]: [Short Title]

**Date**: [YYYY-MM-DD]
**Status**: [Proposed | Accepted | Deprecated | Superseded by ADR-X]
**Deciders**: [names/teams who participated]

---

## Context

[2-4 sentences: the problem that needed solving, the constraints that existed,
and why a decision was needed now rather than later.]

## Decision Drivers

- [Driver 1: e.g., need to support 10k concurrent connections]
- [Driver 2: e.g., team doesn't have Go expertise]
- [Driver 3: e.g., must integrate with existing Temporal setup]

## Options Considered

### Option 1: [Name]
**Description**: [what this option is]
**Pros**:
- [pro 1]
- [pro 2]
**Cons**:
- [con 1]
- [con 2]

### Option 2: [Name]
[same format]

### Option 3: [Name] (if applicable)
[same format]

## Decision

**Chosen option**: [Option X]

**Reasoning**:
[The actual reasoning — not just "it was the best option" but *why* given the context
and constraints above. This is the most important part to preserve.]

## Consequences

**Positive**:
- [what becomes easier or better]

**Negative**:
- [what becomes harder, the tradeoffs accepted]
- [technical debt introduced, if any]

**Neutral**:
- [things that change but aren't inherently better or worse]

## Review Triggers

This decision should be revisited if:
- [condition 1: e.g., team size grows beyond X engineers]
- [condition 2: e.g., this pattern causes 3+ incidents]
- [condition 3: e.g., the library is abandoned]

---
*Generated from conversation on [date] in [Slack channel / PR link]*
```

## ADR Index Template

Maintain this in `docs/decisions/README.md`:

```markdown
# Architecture Decision Records

| ADR | Title | Status | Date |
|---|---|---|---|
| [ADR-001](./001-database-choice.md) | Use MongoDB as primary database | Accepted | 2024-01 |
| [ADR-002](./002-temporal-for-workflows.md) | Use Temporal for long-running workflows | Accepted | 2024-03 |
| [ADR-003](./003-socket-redis-adapter.md) | Redis adapter for Socket.IO horizontal scaling | Accepted | 2024-06 |
```

## What Makes a Good ADR

**Include**:
- The context that made the decision necessary
- Options that were *actually* considered (not obvious losers)
- The real reasoning, including uncomfortable tradeoffs
- What would trigger revisiting this decision

**Avoid**:
- Post-hoc rationalization (don't make it sound better than it was)
- Missing the "why" and only documenting the "what"
- Vague consequences ("will be more maintainable")
- Missing the date (context changes — old ADRs from different company phase)

## When to Write an ADR

Write one whenever:
- The decision affects multiple services or teams
- You're choosing between two genuinely reasonable options
- Future developers will wonder "why did they do it this way?"
- The decision introduces a constraint that will last > 6 months
- You had a long discussion before deciding (signal of non-obvious choice)
