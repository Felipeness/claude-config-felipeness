---
description: Review staged changes against CLAUDE.md guidelines
allowed-tools: Bash(git:*)
---

# Review Staged Changes

Review all staged changes for quality and adherence to standards.

## Process

### 1. Get Staged Changes
```bash
git diff --cached
```

### 2. Review Checklist

**Type Safety**
- [ ] No `any` types
- [ ] Minimal `as` casting
- [ ] E2E type coverage

**Clarity**
- [ ] Descriptive names (no `data`, `info`, `stuff`)
- [ ] Early returns (flat code)
- [ ] No magic strings/numbers

**React (if applicable)**
- [ ] Components are pure
- [ ] React Query for data fetching
- [ ] Proper Suspense/Error boundaries

**Security**
- [ ] Input validation
- [ ] Query builders (no raw SQL)
- [ ] No exposed secrets

**Accessibility**
- [ ] Semantic HTML
- [ ] ARIA labels where needed
- [ ] Keyboard navigation

**Testing**
- [ ] Tests behavior, not implementation
- [ ] Bug fixes have tests

### 3. Output Format

```
## Summary
[Brief overview of changes]

## Issues Found
### Critical (must fix)
- [Issue + suggestion]

### Suggested (should fix)
- [Issue + suggestion]

## Approval
✅ Ready to commit | ⚠️ Minor fixes needed | ❌ Needs changes
```
