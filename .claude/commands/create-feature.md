---
description: Plan and implement a new feature following CLAUDE.md guidelines with focus on clarity, observability, security, accessibility, and performance
argument-hint: [feature description]
---

# Create Feature

Implement: $ARGUMENTS

## Workflow

### 1. Branch Creation
```bash
git checkout main && git pull
git checkout -b feat/<feature-name>
```

### 2. Planning Phase
Before writing code:
- Analyze existing codebase patterns
- Identify integration points
- Break into small, atomic tasks
- Plan for e2e type-safety

### 3. Implementation
Apply these principles:

**Clarity**
- Descriptive names (`userPaymentDeadline` > `data`)
- Early returns over nested if-else
- No abbreviations

**Type Safety**
- Never use `any`
- Let compiler infer types
- Use query builders for database

**React (if applicable)**
- Keep components pure (no constants inside)
- React Query for data fetching
- Suspense + Error Boundaries

### 4. Quality Checks
- [ ] Type-safe end-to-end
- [ ] Error handling with monitoring
- [ ] Accessibility (WCAG 2.0)
- [ ] Security (OWASP basics)
- [ ] Tests for behavior (not implementation)

### 5. Stage Changes
```bash
git add -A
```

## Output
Leave all changes staged for review before commit.
