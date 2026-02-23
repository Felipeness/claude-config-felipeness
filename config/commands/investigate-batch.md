---
description: Systematic discovery through focused questions before planning (batched)
argument-hint: [topic or goal]
---

# Investigation Protocol (Batched)

Before planning or implementing, investigate: $ARGUMENTS

## Process

### 1. Initial Discovery
Ask up to 5 questions at once using AskUserQuestion with multiple questions. Group related questions:
- Current state (what exists today?)
- Desired outcome (what should exist?)
- Constraints (budget, timeline, dependencies?)
- Success criteria (how do we know it works?)
- Technical preferences or requirements

### 2. Codebase Analysis
- Search for related patterns and conventions
- Identify integration points
- Map dependencies and impact radius
- Note existing solutions to similar problems

### 3. Follow-up Questions
If needed, batch remaining questions (max 5 per round):
- Technical unknowns
- Business rule ambiguities
- Edge cases that need clarification

### 4. Output
Provide a structured summary:
```
## Understanding
[What I learned about the topic]

## Open Questions
[Any remaining questions that need answers]

## Suggested Approach
[High-level direction based on findings]
```

## Rules
- Batch up to 5 questions per round to minimize token usage
- Ask before assuming
- Explore before planning
- Understand before implementing
- Surface ambiguity early
