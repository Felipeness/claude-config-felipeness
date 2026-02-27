---
name: refactoring
description: Safe, structured refactoring methodology. Use when improving existing code after reviews, reducing complexity, extracting patterns, or cleaning up tech debt. Complements ultrathink-review by guiding the actual implementation of improvements.
---

# Refactoring Guidelines

How to improve existing code without breaking it.

## Golden Rule

Refactoring changes structure, never behavior. If behavior changes, it's a feature or bug fix, not a refactoring.

## Before Refactoring

### Prerequisites
- [ ] Tests exist and pass (if not, write them first)
- [ ] You understand what the code does (read before changing)
- [ ] The refactoring has a clear goal (not "make it better")
- [ ] Changes are scoped (one refactoring per commit)

### Don't Refactor
- Code you don't understand yet
- Code without test coverage (write tests first)
- Multiple things at once
- During a feature implementation (separate commits)

## Safe Refactoring Patterns

### Extract Function
When: A block of code does one identifiable thing
```typescript
// Before: inline logic
const users = data.filter(u => u.active && u.role === 'admin' && u.lastLogin > cutoff)

// After: named intent
const activeAdmins = filterActiveAdmins(data, cutoff)
```

### Replace Conditional with Hash-List
When: Switch/if-else chain maps values
```typescript
// Before
if (status === 'pending') return 'yellow'
if (status === 'active') return 'green'
if (status === 'inactive') return 'red'

// After
const statusColor = { pending: 'yellow', active: 'green', inactive: 'red' } as const
return statusColor[status]
```

### Flatten Nested Code
When: Indentation exceeds 2 levels
```typescript
// Before
if (user) {
  if (user.active) {
    if (user.hasPermission('admin')) {
      doThing()
    }
  }
}

// After (guard clauses)
if (!user) return
if (!user.active) return
if (!user.hasPermission('admin')) return
doThing()
```

### Co-locate Related Code
When: Related code is scattered across files
- Move types next to where they're used
- Move helper used by one module into that module
- A folder with one file should be a file

### Remove Dead Code
When: Code is unreachable or unused
- Delete it completely (git has history)
- Don't comment out (no `// removed`, no `_unused` renames)
- Use knip or ts-prune to find dead exports

### Extract Type
When: An inline type is used 2-3+ times
```typescript
// Before: duplicated shape
function getUser(id: string): { name: string; email: string } { }
function updateUser(user: { name: string; email: string }) { }

// After: shared type
type User = { name: string; email: string }
```

### Rename for Clarity
When: Name is vague, abbreviated, or misleading
- `data` → `userPayments`
- `handler` → `processWebhookEvent`
- `res` → `apiResponse`
- `cb` → `onPaymentComplete`

## Process

### 1. Identify
Pick ONE specific improvement from review findings

### 2. Test
Verify existing tests cover the code (add if missing)

### 3. Refactor
Apply the change in the smallest possible step

### 4. Verify
Run tests after each step (they must all pass)

### 5. Commit
One refactoring per commit with clear message:
```
refactor: extract webhook signature verification
refactor: flatten nested conditionals in payment handler
refactor: rename ambiguous variables in user service
```

## Anti-Patterns

- **Big bang refactor**: Changing everything at once (high risk, hard to review)
- **Speculative generalization**: Abstracting for hypothetical future needs
- **Refactor during feature work**: Mix of behavior change + structure change
- **Gold plating**: Making code "perfect" beyond what's needed
- **Premature DRY**: Abstracting after 1 occurrence (wait for 2-3)
