---
name: code-quality
description: Comprehensive code quality principles — CUPID, SOLID, DRY, KISS, YAGNI, Defensive Programming, Early Return, Short-Circuit Evaluation, cognitive load reduction, and modern design patterns. Use when writing, reviewing, or refactoring any code. Prioritizes readability, clarity, and expressiveness.
---

# Code Quality — Principles, Patterns & Practices

Write code that fits in your head. Reduce cognitive load. Make the simple things simple and the complex things possible.

---

## 1. CUPID — Properties for Joyful Code

CUPID defines **properties** (a center to move toward), not rules (comply or violate). Improving one tends to improve the others.

### Composable — plays well with others
- Small surface area: narrow, opinionated APIs
- Intention-revealing: discoverable and quick to assess
- Minimal dependencies: every dependency must earn its place

### Unix philosophy — does one thing well
- Each component has a single, comprehensive purpose (outside-in view)
- Components compose via clear inputs/outputs
- Don't split by technical layer — split by purpose

### Predictable — does what you expect
- **Deterministic**: same input → same output
- **Robust**: covers edge cases, limitations are obvious
- **Observable**: internal state inferable from outputs (designed-in, not bolted-on)

### Idiomatic — feels natural
- Follow language/framework conventions (Go = `gofmt`, Python = PEP 8, TS = community patterns)
- When the community has no consensus, the team decides and documents via ADRs
- Optimize for the reader, not the writer

### Domain-based — models the problem domain
- Use domain types: `Money` not `float`, `Email` not `string`
- Directory structure reflects business domains, not framework layers (Screaming Architecture)
- A domain expert should understand the code without knowing the framework

---

## 2. SOLID — Quick Reference

| Principle | Rule of thumb |
|---|---|
| **S** — Single Responsibility | Can you describe what it does without "and"? |
| **O** — Open/Closed | Add behavior by adding code, not modifying existing |
| **L** — Liskov Substitution | Subtypes honor the parent contract — no surprises |
| **I** — Interface Segregation | No client depends on methods it doesn't use |
| **D** — Dependency Inversion | Only invert when multiple implementations genuinely exist |

Avoid SOLID dogma. Don't create one-interface-per-class for testability. Don't split what belongs together. Use CUPID as the lens: does this split make the code more composable, predictable, idiomatic?

---

## 3. DRY, KISS, YAGNI

### DRY — Don't Repeat Yourself
- Abstract at **3 occurrences**, not 2 (premature DRY is worse than duplication)
- Duplication of logic is bad. Duplication of similar-looking code with different intent is fine
- Wrong abstraction is costlier than duplication — duplicate first, abstract later

### KISS — Keep It Simple
- Can a new team member understand this in 5 minutes?
- Is there a simpler way to achieve the same result?
- Does the complexity match the problem complexity?
- Three similar lines > premature abstraction

### YAGNI — You Aren't Gonna Need It
- Build what's needed NOW, refactor when requirements change
- No "future-proofing" without a concrete use case
- Every unused abstraction is debt, not investment

---

## 4. Cognitive Load Reduction

### Metrics & Thresholds

| Metric | Target | Smell |
|---|---|---|
| Function length | 5-20 lines | > 50 lines |
| Nesting depth | 0-1 levels | 3+ levels |
| Parameters | 0-3 | 4+ (use object) |
| Cognitive complexity | < 10 | > 15 |
| Boolean operands per condition | ≤ 3 | 4+ (extract predicate) |
| File length | 200-400 lines | > 500 lines |

### Naming as Documentation
- Functions: verb phrases → `calculateTotal`, `validateInput`, `sendNotification`
- Booleans: question form → `isActive`, `hasPermission`, `canRetry`
- Variables: specific → `userPayments` not `data`, `retryCount` not `n`
- Constants: intent → `MAX_RETRY_ATTEMPTS` not `THREE`
- No abbreviations unless universally understood (`id`, `url`, `api`)

### Extract Named Predicates
```typescript
// Bad: what does this mean?
if (age > 18 && hasLicense && !isSuspended && demeritPoints < 12)

// Good: named intent
if (canDrive(person))
```

### Declare Variables Close to Use
Minimize "liveness span" — distance between declaration and last usage. The brain holds fewer things at once.

---

## 5. Control Flow

### Guard Clauses & Early Return
```typescript
// Bad: nested pyramid
function processOrder(order: Order | null): Result<string> {
  if (order) {
    if (order.items.length > 0) {
      if (order.paymentVerified) {
        return ok(fulfillOrder(order))
      }
      return err("Payment not verified")
    }
    return err("No items")
  }
  return err("No order")
}

// Good: flat bouncers
function processOrder(order: Order | null): Result<string> {
  if (!order) return err("No order")
  if (order.items.length === 0) return err("No items")
  if (!order.paymentVerified) return err("Payment not verified")

  return ok(fulfillOrder(order))
}
```

Rules:
- Guard clauses at the top — validate all preconditions upfront
- No `else` after a `return`
- Max 2 levels of nesting — extract at 3+
- Happy path is the last thing in the function, at the leftmost indentation

### Short-Circuit Evaluation
```typescript
// Nullish coalescing for defaults (only null/undefined)
const timeout = config?.network?.retryTimeout ?? 3000

// Logical OR for falsy defaults
const name = user.displayName || "Anonymous"

// Logical AND for conditional execution
isValid && processOrder(order)

// Assignment operators
options.retries ??= 3       // default only if null/undefined
options.verbose ||= false   // default if falsy

// Order matters: cheap checks first, expensive last
const isEligible = isActive && hasSubscription && await checkCreditScore()
```

---

## 6. Defensive Programming

### Validate at System Boundaries
TypeScript types vanish at runtime. Validate all external data (API, forms, env vars, URL params):
```typescript
const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(["admin", "user"]).default("user"),
})
type CreateUserInput = z.infer<typeof CreateUserSchema>

// Parse, don't validate — get typed data or a typed error
const result = CreateUserSchema.safeParse(rawInput)
if (!result.success) return err(result.error.flatten())
// result.data is fully typed from here
```

### Exhaustive Checks with `never`
```typescript
function assertNever(value: never): never {
  throw new Error(`Unhandled: ${JSON.stringify(value)}`)
}

function getLabel(status: OrderStatus): string {
  switch (status) {
    case "pending": return "Awaiting"
    case "shipped": return "On the way"
    case "delivered": return "Done"
    default: return assertNever(status)
    // Adding a new status without a case → compile error
  }
}
```

### Result Type — Typed Error Paths
```typescript
type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E }

function parseConfig(raw: string): Result<Config, "InvalidJSON" | "MissingHost"> {
  let data: unknown
  try { data = JSON.parse(raw) }
  catch { return err("InvalidJSON") }
  if (!isConfigShape(data)) return err("MissingHost")
  return ok(data)
}

// Caller MUST handle both paths — compiler enforces it
const result = parseConfig(input)
if (!result.ok) {
  // result.error is "InvalidJSON" | "MissingHost"
  return handleError(result.error)
}
// result.value is Config — guaranteed valid
```

### Fail-Safe Defaults & Immutability
```typescript
const DEFAULT_CONFIG = {
  retries: 3,
  timeout: 5000,
  logLevel: "info",
} as const satisfies Record<string, unknown>

function loadConfig(overrides?: Partial<AppConfig>): AppConfig {
  return { ...DEFAULT_CONFIG, ...overrides }
}
```

### Custom Type Guards
```typescript
function isNonNullable<T>(value: T): value is NonNullable<T> {
  return value != null
}

// Filter nulls with proper type narrowing
const valid: User[] = users.filter(isNonNullable)
```

---

## 7. Design Patterns — Practical, Not Academic

### Strategy Map (replace switch/if-else chains)
```typescript
type Tier = "free" | "basic" | "premium"

const pricing: Record<Tier, (base: number) => number> = {
  free:    () => 0,
  basic:   (base) => base,
  premium: (base) => base * 0.9,
}

const price = pricing[tier](basePrice)
// New tier = one line. Each strategy independently testable.
```

### Discriminated Unions (state machines)
```typescript
type Order =
  | { status: "draft" }
  | { status: "paid"; paidAt: Date }
  | { status: "shipped"; paidAt: Date; trackingId: string }
  | { status: "cancelled"; reason: string }

// Impossible to have a "shipped" order without trackingId
// Impossible to have boolean flag contradictions
// TypeScript narrows automatically in switch/if
```

### Branded Types (prevent primitive obsession)
```typescript
type Brand<T, B extends string> = T & { readonly __brand: B }

type UserId = Brand<string, "UserId">
type PostId = Brand<string, "PostId">
type Email = Brand<string, "Email">
type USD = Brand<number, "USD">

function getUser(id: UserId) { /* ... */ }
getUser(postId) // compile error — PostId ≠ UserId
```

### Composition Over Inheritance
```typescript
// Bad: rigid class hierarchy
class GuideDog extends Dog extends Animal { ... }

// Good: compose behaviors
interface Speaker { speak(): string }
interface Guide { guide(): string }

function createGuideDog(): Speaker & Guide {
  return { ...createDogSpeaker(), ...createGuide() }
}
```

### Higher-Order Functions (reusable cross-cutting concerns)
```typescript
function withRetry<Args extends unknown[], R>(
  fn: (...args: Args) => Promise<R>,
  maxRetries = 3,
): (...args: Args) => Promise<R> {
  return async (...args) => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try { return await fn(...args) }
      catch (e) { if (attempt === maxRetries - 1) throw e }
    }
    throw new Error("Unreachable")
  }
}

const fetchUserSafe = withRetry(fetchUser)
const fetchOrderSafe = withRetry(fetchOrder, 5)
```

### Fluent Builder (many optional params)
```typescript
const query = new QueryBuilder<User>()
  .from("users")
  .select("name", "email")
  .where({ active: true })
  .limit(10)
  .build()
// Reads like a sentence. IDE autocomplete guides the API.
```

---

## 8. Modern TypeScript Idioms

### `satisfies` — validate structure, preserve literal types
```typescript
const routes = {
  home: "/",
  about: "/about",
} satisfies Record<string, string>

routes.home  // type is "/" not string
routes.oops  // compile error
```

### `as const` — deepest readonly + literal narrowing
```typescript
const STATUS = ["active", "inactive", "pending"] as const
type Status = (typeof STATUS)[number] // "active" | "inactive" | "pending"
```

### Template Literal Types — compile-time string validation
```typescript
type EventName = `on${Capitalize<"click" | "focus">}${Capitalize<"button" | "input">}`
// "onClickButton" | "onClickInput" | "onFocusButton" | "onFocusInput"
```

### Exhaustive Pattern Matching (ts-pattern)
```typescript
import { match } from "ts-pattern"

const label = match(shape)
  .with({ kind: "circle" }, ({ radius }) => `Circle r=${radius}`)
  .with({ kind: "rect" }, ({ w, h }) => `Rect ${w}x${h}`)
  .exhaustive() // compile error if any variant missing
```

---

## 9. Architecture — Screaming Architecture

Directory structure should scream **what the app does**, not what framework it uses.

```
// Bad: screams "I use MVC!"
src/controllers/ src/services/ src/models/ src/repositories/

// Good: screams "I'm an e-commerce system!"
src/
  orders/
    create-order.ts       ← use case
    cancel-order.ts       ← use case
    order.ts              ← domain entity
    order.repository.ts   ← port/interface
    order.test.ts         ← co-located test
  payments/
    process-payment.ts
    refund-payment.ts
    payment.gateway.ts
  shipping/
    calculate-shipping.ts
    track-shipment.ts
  shared/
    result.ts
    errors.ts
  infrastructure/         ← framework details at the edges
    database/
    http/
    messaging/
```

Rules:
- Domain concepts are top-level directories
- Use cases are files (filename = business operation)
- Infrastructure depends on domain, never the reverse
- Tests co-locate with source code
- A new developer understands the domain in seconds

---

## 10. Code Review Checklist

### Critical (blocks merge)
- [ ] Security vulnerabilities (injection, XSS, exposed secrets)
- [ ] Type-safety violations (`any`, unsafe casts, unvalidated inputs)
- [ ] Missing error handling at system boundaries
- [ ] Breaking changes without migration

### High (should fix before merge)
- [ ] Functions > 50 lines or > 3 params
- [ ] Nesting > 2 levels
- [ ] Duplicated logic (3+ occurrences)
- [ ] Missing exhaustive checks on unions
- [ ] Mutable shared state

### Medium (should fix)
- [ ] Vague naming (`data`, `handler`, `res`, `cb`)
- [ ] Missing guard clauses (nested conditionals)
- [ ] Switch/if-else chains replaceable by strategy map
- [ ] Boolean flags as parameters
- [ ] Commented-out code

### Low (nice to fix)
- [ ] Non-idiomatic code for the language
- [ ] Framework-centric directory structure
- [ ] Missing `as const` / `satisfies` where beneficial
- [ ] Primitive obsession (string where branded type fits)
