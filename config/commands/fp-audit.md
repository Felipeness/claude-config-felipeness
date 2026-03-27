---
description: Audit code for functional programming violations — mutation, side effects, missing idempotency, partial functions, CQS violations, imperative patterns, missing parse-don't-validate, and more. Uses the functional-programming skill.
allowed-tools: Bash(git:*)
---

# Functional Programming Audit

Audit current changes (or specified files/modules) for functional programming violations using the `functional-programming` skill.

## Audit Process

1. **Scope Identification**
   - If git changes exist, analyze `git diff` to focus on changed files
   - If a module/path is specified by the user, focus on that area
   - Otherwise, audit the full `src/` directory

2. **Mutation Detection**
   - Array mutations: `push`, `splice`, `sort()`, `reverse()`, direct index assignment
   - Object mutations: property reassignment, `delete` operator
   - Map/Set mutations: `set()`, `add()`, `delete()`, `clear()`
   - Parameter mutations: modifying function arguments instead of returning new values
   - Shared mutable state between functions or modules
   - `let` declarations that could be `const`

3. **Side Effect Analysis**
   - Business logic functions with I/O (database, HTTP, filesystem)
   - Pure functions that depend on external state (`Date.now()`, `Math.random()`, globals)
   - Data transformations with side effects (logging inside map/filter/reduce)
   - Mixed responsibilities: functions that both compute AND persist
   - Missing dependency injection for time, randomness, or external services

4. **Idempotency Review**
   - POST endpoints without idempotency keys for critical operations
   - State transitions without guards (e.g., updating without checking current state)
   - Relative operations (increment/decrement) where absolute would be safer
   - Database operations that aren't safe to retry (INSERT without ON CONFLICT)

5. **Totality & Parse-Don't-Validate**
   - Partial functions: `Array.find()!`, `map.get()!`, unchecked `arr[index]`
   - Non-null assertions (`!`) hiding possible undefined
   - Functions that can throw but return type doesn't reflect it
   - Raw `string`/`number` where branded/opaque types would prevent misuse
   - Validation that returns boolean instead of parsing into refined type
   - Re-validation of already-parsed data deeper in the stack
   - Smart constructor opportunities (Email, PositiveNumber, NonEmptyArray)

6. **Command Query Separation (CQS)**
   - Functions that both return data AND cause side effects
   - Getters with hidden mutations
   - `deleteAndReturn` patterns (should be split into separate operations)
   - `forEach` used for data transformations instead of `map`

7. **Imperative Pattern Detection**
   - `for`/`while` loops replaceable by `map`/`filter`/`reduce`/`flatMap`
   - Mutable accumulators (`let result = []; ... result.push(...)`)
   - If-else chains replaceable by data-driven lookups (Record maps)
   - `forEach` used for transformations (should be `map`)
   - Nested conditionals where pipeline composition would be clearer

8. **Functional Core / Imperative Shell Check**
   - Business rules mixed with I/O in the same function
   - Validation logic inside controllers (should be in pure functions)
   - State transition rules embedded in repositories (should be in domain)
   - Calculations that require mocks to test (sign of impurity)

9. **Type-Level Immutability**
   - Missing `Readonly<T>` on DTOs, configs, and shared data
   - Missing `readonly` on array/tuple properties
   - Missing `as const` on constant objects/arrays
   - Mutable Maps/Sets where ReadonlyMap/ReadonlySet would suffice
   - Unnecessary `structuredClone` where shallow spread preserves structural sharing

10. **Railway & Error Handling**
    - Thrown exceptions for expected business failures (should be Result types)
    - Try-catch used for control flow instead of typed error paths
    - Missing exhaustive handling on discriminated unions
    - Error information lost in catch blocks (swallowed or generic re-throw)

11. **Composition & Encapsulation**
    - Classes used where closures/factory functions would suffice (outside NestJS DI)
    - `this` keyword in non-class contexts (binding issues)
    - Missing lens/helper for repeated deep nested immutable updates
    - Monoid opportunities: merging configs, combining validators, accumulating permissions
    - Missing currying/partial application for reusable function variations

12. **Testing Patterns**
    - Pure functions tested with mocks (should be tested directly, no mocks needed)
    - Missing property-based tests for functions with mathematical invariants
    - Missing round-trip tests for serialization/deserialization
    - Missing idempotency tests for parsers and normalizers

## Output Format

### Summary
- [Files/modules analyzed, scope of audit]
- [Overall FP health score: Strong / Moderate / Needs Work]

### Critical Violations (blocks quality)
- [Mutation of shared state]
- [Side effects in business logic core]
- [Non-idempotent critical operations]
- [Partial functions hiding crashes (`!`, unchecked access)]

### High Priority (should fix)
- [Parameter mutations]
- [Business rules mixed with I/O]
- [Missing immutability annotations]
- [CQS violations (mixed command/query)]
- [Raw primitives where branded types prevent bugs]
- [Validation instead of parsing at boundaries]

### Medium Priority (improve)
- [Imperative patterns replaceable by declarative]
- [forEach for transformations]
- [Missing Result types for expected failures]
- [Classes replaceable by closures/factory functions]
- [Unnecessary deep clones breaking structural sharing]

### Low Priority (nice to have)
- [Point-free opportunities]
- [Memoization candidates]
- [Pipeline composition opportunities]
- [Phantom type opportunities for state encoding]
- [Monoid pattern for combining operations]
- [Property-based test candidates]
- [Lazy evaluation for expensive deferred computations]

### Refactoring Suggestions
- [Specific code → refactored version for each violation found]
- [Group by pattern: "Extract pure function", "Replace mutation", "Add idempotency guard", "Parse don't validate", "Convert partial to total", "Split command/query", "Replace class with closure", etc.]
