---
name: functional-programming
description: Comprehensive functional programming principles for TypeScript — pure functions, immutability, idempotency, side effect isolation, composition, Railway Oriented Programming, parse don't validate, total functions, CQS, closures, lenses, lazy evaluation, property-based testing, and declarative patterns. Use when writing, reviewing, or refactoring any code to reduce bugs, improve testability, and eliminate hidden state.
---

# Functional Programming — Principles & Patterns

Write code that is predictable, testable, and composable. Isolate side effects. Make invalid states unrepresentable. Prefer data transformations over mutations.

---

## 1. Pure Functions

A function is pure when: (1) same input always produces same output, (2) no side effects.

### Rules
- No reading/writing external state (DB, filesystem, global variables, `Date.now()`, `Math.random()`)
- No mutations of input arguments
- Return value depends ONLY on arguments
- If you need a side effect, push it to the caller (Functional Core, Imperative Shell)

```typescript
// Impure: depends on external state, mutates input
function applyDiscount(order: Order) {
  const rate = getDiscountRate() // external call
  order.total *= rate            // mutation
  return order
}

// Pure: all inputs explicit, returns new data
function applyDiscount(order: Order, discountRate: number): Order {
  return { ...order, total: order.total * discountRate }
}
```

### When purity is not practical
- I/O (database, HTTP, filesystem) — isolate at boundaries
- Logging — use interceptors/middleware, not inline calls
- Time/randomness — inject as dependencies (`clock: () => Date`, `random: () => number`)

```typescript
// Inject dependencies instead of reaching for globals
function createToken(
  payload: TokenPayload,
  clock: () => Date = () => new Date(),
): Token {
  return { ...payload, issuedAt: clock(), expiresAt: addHours(clock(), 24) }
}
// Tests pass a fixed clock: createToken(payload, () => new Date("2026-01-01"))
```

---

## 2. Immutability

Data should never change after creation. Create new values instead of modifying existing ones.

### TypeScript Enforcement

```typescript
// Shallow readonly
type User = Readonly<{
  name: string
  roles: readonly string[]
  address: Readonly<Address>
}>

// Deep readonly utility
type DeepReadonly<T> = T extends (infer U)[]
  ? readonly DeepReadonly<U>[]
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T

// Readonly collections
const users: ReadonlyMap<string, User> = new Map()
const ids: ReadonlySet<string> = new Set()
const items: readonly Item[] = []
```

### Immutable Updates

```typescript
// Objects: spread operator
const updated = { ...user, name: "New Name" }

// Nested objects: spread at each level
const updated = {
  ...user,
  address: { ...user.address, city: "New City" },
}

// Arrays: non-mutating methods ONLY
const added = [...items, newItem]                        // push
const removed = items.filter((i) => i.id !== targetId)   // splice
const changed = items.map((i) =>                         // in-place update
  i.id === targetId ? { ...i, status: "done" } : i
)
const sorted = [...items].sort(compareFn)                // sort (creates copy first)
const reversed = [...items].reverse()                    // reverse
const inserted = [...items.slice(0, idx), newItem, ...items.slice(idx)]

// Deep clone when nesting is complex
const copy = structuredClone(original)
```

### What to NEVER do

```typescript
// NEVER mutate arrays
items.push(newItem)       // use: [...items, newItem]
items.splice(1, 1)        // use: items.filter(...)
items[0] = newValue       // use: items.map(...)
items.sort()              // use: [...items].sort()
items.reverse()           // use: [...items].reverse()

// NEVER mutate objects
user.name = "New"         // use: { ...user, name: "New" }
delete user.role          // use: const { role, ...rest } = user

// NEVER mutate Maps/Sets
map.set(key, value)       // use: new Map([...map, [key, value]])
set.add(value)            // use: new Set([...set, value])
```

### `as const` and `satisfies` for Immutable Constants

```typescript
// Immutable config with literal types preserved
const LEAD_STATUSES = ["novo", "contatado", "qualificado", "proposta", "ganho", "perdido"] as const
type LeadStatus = (typeof LEAD_STATUSES)[number]

// Validated immutable records
const STATUS_LABELS = {
  novo: "Novo Lead",
  contatado: "Contatado",
  qualificado: "Qualificado",
} as const satisfies Record<string, string>
```

---

## 3. Idempotency

An operation is idempotent when calling it N times produces the same result as calling it once.

### API Idempotency

```typescript
// Idempotent: safe to retry
PUT    /leads/42         → always sets the full resource
DELETE /leads/42         → first call deletes, subsequent calls return 404 (same end state)
GET    /leads            → always returns current state

// NOT idempotent: each call changes state
POST   /leads            → creates a new lead every time
PATCH  /leads/42         → may depend on current state (increment counter, etc.)
```

### Idempotency Keys (make non-idempotent operations safe)

```typescript
// Client sends a unique key per intent
async function createLead(data: CreateLeadDto, idempotencyKey: string): Promise<Lead> {
  const existing = await findByIdempotencyKey(idempotencyKey)
  if (existing) return existing // already processed — return same result

  const lead = await insertLead({ ...data, idempotencyKey })
  return lead
}

// Caller retries safely:
// POST /leads + X-Idempotency-Key: "abc-123" → same lead every time
```

### Database Idempotency

```typescript
// Idempotent: UPSERT (insert or update, same end state regardless of retries)
await db
  .insert(leads)
  .values(data)
  .onConflictDoUpdate({
    target: leads.email,
    set: { nome: data.nome, updatedAt: new Date() },
  })

// Idempotent: state transitions with guards
await db
  .update(propostas)
  .set({ status: "enviada" })
  .where(
    and(
      eq(propostas.id, id),
      eq(propostas.status, "rascunho"), // only transitions FROM rascunho
    ),
  )
```

### Service Logic Idempotency

```typescript
// Idempotent: set absolute value
function setLeadStatus(leadId: number, status: LeadStatus): Promise<Lead> { ... }

// NOT idempotent: relative operation
function incrementViewCount(leadId: number): Promise<Lead> { ... }

// Make it idempotent: use reference point
function setViewCount(leadId: number, count: number): Promise<Lead> { ... }
```

---

## 4. Side Effect Isolation — Functional Core, Imperative Shell

Keep business logic pure. Push I/O to the boundaries.

```
┌─────────────────────────────────────────────┐
│             Imperative Shell                │
│  (Controllers, Repositories, External I/O)  │
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │         Functional Core             │   │
│   │   (Business Rules, Validations,     │   │
│   │    Transformations, Calculations)   │   │
│   │                                     │   │
│   │   • Pure functions only             │   │
│   │   • No I/O, no side effects         │   │
│   │   • Fully testable without mocks    │   │
│   └─────────────────────────────────────┘   │
│                                             │
│   Shell calls Core, never the reverse       │
└─────────────────────────────────────────────┘
```

### In Practice (NestJS)

```typescript
// === FUNCTIONAL CORE (pure, no dependencies) ===

// Pure: validates if transition is allowed
function canTransitionLead(from: LeadStatus, to: LeadStatus): boolean {
  const allowed: Record<LeadStatus, LeadStatus[]> = {
    novo: ["contatado", "perdido"],
    contatado: ["qualificado", "perdido"],
    qualificado: ["proposta", "perdido"],
    proposta: ["negociacao", "perdido"],
    negociacao: ["ganho", "perdido"],
    ganho: [],
    perdido: [],
  }
  return allowed[from].includes(to)
}

// Pure: calculates commission
function calculateCommission(valor: number, tipo: TipoNegocio): number {
  const rates = { venda: 0.06, locacao: 0.01 } as const
  return valor * rates[tipo]
}

// Pure: enriches lead data
function enrichLeadForCreation(
  data: CreateLeadDto,
  userId: number,
  imbId: number,
): LeadInsert {
  return {
    ...data,
    status: data.status ?? "novo",
    temperatura: data.temperatura ?? "frio",
    corretorId: data.corretorId ?? userId,
    imbId,
  }
}

// === IMPERATIVE SHELL (service, has side effects) ===

class LeadsService {
  async updateStatus(id: number, newStatus: LeadStatus, user: AuthUser) {
    const lead = await this.repository.findById(id, user.imobiliaria_id)
    if (!lead) throw new NotFoundException("Lead not found")

    // Pure function decides — no I/O
    if (!canTransitionLead(lead.status, newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${lead.status} to ${newStatus}`,
      )
    }

    // Shell handles I/O
    return this.repository.update(id, { status: newStatus })
  }
}
```

### Testing Pure vs Impure

```typescript
// Pure core: NO mocks needed, instant tests
describe("canTransitionLead", () => {
  it("allows novo to contatado", () => {
    expect(canTransitionLead("novo", "contatado")).toBe(true)
  })

  it("blocks ganho to novo", () => {
    expect(canTransitionLead("ganho", "novo")).toBe(false)
  })
})

// Shell: needs mocks (fewer tests needed since logic is in core)
describe("LeadsService.updateStatus", () => {
  it("delegates transition check to pure function", async () => {
    repository.findById.mockResolvedValue({ status: "ganho" })
    await expect(service.updateStatus(1, "novo", user))
      .rejects.toThrow("Cannot transition")
  })
})
```

---

## 5. Function Composition

Build complex operations by combining simple functions.

### Pipe (left-to-right composition)

```typescript
// Utility
function pipe<T>(value: T, ...fns: Array<(arg: any) => any>): any {
  return fns.reduce((acc, fn) => fn(acc), value)
}

// Usage: read top-to-bottom like a recipe
const result = pipe(
  rawInput,
  validateInput,
  normalizeEmail,
  enrichWithDefaults,
  formatForDatabase,
)

// Each function: one job, testable in isolation, no shared state
```

### Point-Free Style (when it aids readability)

```typescript
// Instead of wrapping in anonymous functions
const activeUsers = users.filter((user) => isActive(user))
const emails = users.map((user) => getEmail(user))

// Point-free: the function IS the callback
const activeUsers = users.filter(isActive)
const emails = users.map(getEmail)

// Only use when the function signature matches exactly
// Don't force it: users.map(String) is fine, users.map(parseInt) is buggy
```

### Compose Transformations (not steps)

```typescript
// Bad: imperative steps with shared mutable state
let data = getRawData()
data = cleanData(data)
data = validateData(data)
data = transformData(data)
data = enrichData(data)

// Good: transformation pipeline, immutable
const processData = (raw: RawData): ProcessedData =>
  pipe(raw, cleanData, validateData, transformData, enrichData)
```

---

## 6. Railway Oriented Programming

Chain operations where each step can succeed or fail. Success continues down the track; failure skips to the end.

```typescript
type Result<T, E = string> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E }

const ok = <T>(value: T): Result<T, never> => ({ ok: true, value })
const err = <E>(error: E): Result<never, E> => ({ ok: false, error })

// Chain: each step only runs if previous succeeded
function chain<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E> {
  return result.ok ? fn(result.value) : result
}

// Map: transform success value
function map<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U,
): Result<U, E> {
  return result.ok ? ok(fn(result.value)) : result
}
```

### Chaining Operations

```typescript
type CreatePropostaError =
  | "LEAD_NOT_FOUND"
  | "IMOVEL_UNAVAILABLE"
  | "INVALID_VALUE"
  | "DUPLICATE_PROPOSTA"

function validateValor(data: CreatePropostaDto): Result<CreatePropostaDto, CreatePropostaError> {
  return data.valor > 0 ? ok(data) : err("INVALID_VALUE")
}

function checkImovelAvailable(data: CreatePropostaDto): Result<CreatePropostaDto, CreatePropostaError> {
  // ... check availability
  return isAvailable ? ok(data) : err("IMOVEL_UNAVAILABLE")
}

function checkDuplicate(data: CreatePropostaDto): Result<CreatePropostaDto, CreatePropostaError> {
  // ... check existing
  return isDuplicate ? err("DUPLICATE_PROPOSTA") : ok(data)
}

// Railway: stops at first failure, skips remaining steps
function validateProposta(data: CreatePropostaDto): Result<CreatePropostaDto, CreatePropostaError> {
  let result: Result<CreatePropostaDto, CreatePropostaError> = ok(data)
  result = chain(result, validateValor)
  result = chain(result, checkImovelAvailable)
  result = chain(result, checkDuplicate)
  return result
}

// Controller handles the two tracks
const result = validateProposta(dto)
if (!result.ok) {
  // Typed error — exhaustive handling possible
  throw mapToHttpException(result.error)
}
// result.value is validated CreatePropostaDto
```

---

## 7. Declarative Over Imperative

Describe WHAT you want, not HOW to do it.

### Data Transformations

```typescript
// Imperative: HOW (manual loop, mutation, index tracking)
const activeEmails: string[] = []
for (let i = 0; i < users.length; i++) {
  if (users[i].active) {
    activeEmails.push(users[i].email.toLowerCase())
  }
}

// Declarative: WHAT (filter, then transform)
const activeEmails = users
  .filter((u) => u.active)
  .map((u) => u.email.toLowerCase())
```

### Object Construction

```typescript
// Imperative
const config: Record<string, unknown> = {}
if (options.timeout) config.timeout = options.timeout
if (options.retries) config.retries = options.retries
if (options.baseUrl) config.baseUrl = options.baseUrl

// Declarative: spread + nullish filtering
const config = Object.fromEntries(
  Object.entries(options).filter(([, v]) => v != null)
)
```

### Conditionals

```typescript
// Imperative: nested if-else
function getLeadLabel(status: LeadStatus): string {
  if (status === "novo") return "Novo Lead"
  else if (status === "contatado") return "Em Contato"
  else if (status === "qualificado") return "Qualificado"
  else return "Desconhecido"
}

// Declarative: data-driven lookup
const LEAD_LABELS: Record<LeadStatus, string> = {
  novo: "Novo Lead",
  contatado: "Em Contato",
  qualificado: "Qualificado",
  proposta: "Em Proposta",
  negociacao: "Em Negociação",
  ganho: "Ganho",
  perdido: "Perdido",
} as const

const getLeadLabel = (status: LeadStatus): string => LEAD_LABELS[status]
```

---

## 8. Algebraic Data Types

Model domain states so the type system prevents invalid states.

### Sum Types (one of many shapes)

```typescript
// Each variant carries only the data it needs
type LeadEvent =
  | { type: "CREATED"; leadId: number; corretorId: number }
  | { type: "STATUS_CHANGED"; leadId: number; from: LeadStatus; to: LeadStatus }
  | { type: "ASSIGNED"; leadId: number; fromCorretorId: number; toCorretorId: number }
  | { type: "DELETED"; leadId: number; reason: string }

// Handle exhaustively — compiler catches missing cases
function describeEvent(event: LeadEvent): string {
  switch (event.type) {
    case "CREATED": return `Lead ${event.leadId} criado`
    case "STATUS_CHANGED": return `Lead ${event.leadId}: ${event.from} → ${event.to}`
    case "ASSIGNED": return `Lead ${event.leadId} transferido`
    case "DELETED": return `Lead ${event.leadId} removido: ${event.reason}`
  }
  // No default needed — TypeScript ensures exhaustiveness
}
```

### Making Invalid States Unrepresentable

```typescript
// Bad: boolean flags create impossible combinations
type Proposta = {
  enviada: boolean
  aceita: boolean
  recusada: boolean
  cancelada: boolean
  // Can be both aceita AND recusada? enviada but not aceita nor recusada?
}

// Good: discriminated union — only valid states exist
type Proposta =
  | { status: "rascunho" }
  | { status: "enviada"; enviadaEm: Date }
  | { status: "aceita"; enviadaEm: Date; aceitaEm: Date }
  | { status: "recusada"; enviadaEm: Date; motivo: string }
  | { status: "cancelada"; canceladaEm: Date; motivo: string }
```

---

## 9. Memoization & Referential Transparency

Pure functions can be cached safely — same input always gives same output.

```typescript
// Generic memoize for pure functions
function memoize<Args extends unknown[], R>(
  fn: (...args: Args) => R,
  keyFn: (...args: Args) => string = (...args) => JSON.stringify(args),
): (...args: Args) => R {
  const cache = new Map<string, R>()
  return (...args) => {
    const key = keyFn(...args)
    if (cache.has(key)) return cache.get(key)!
    const result = fn(...args)
    cache.set(key, result)
    return result
  }
}

// Safe to memoize: pure function
const calculateCommission = memoize(
  (valor: number, tipo: TipoNegocio) => valor * RATES[tipo]
)

// NOT safe to memoize: impure (depends on time, external state)
// const getCurrentPrice = memoize(...) // DON'T — result changes over time
```

---

## 10. Currying & Partial Application

Transform multi-argument functions into reusable single-argument functions.

```typescript
// Curried: configure once, reuse many times
const filterByStatus = (status: LeadStatus) =>
  (leads: Lead[]): Lead[] => leads.filter((l) => l.status === status)

const getNewLeads = filterByStatus("novo")
const getQualifiedLeads = filterByStatus("qualificado")

// Use in pipelines
const result = pipe(allLeads, getNewLeads, sortByDate, takeFirst(10))
```

```typescript
// Partial application for dependency injection
const createLeadService = (repository: LeadRepository) => ({
  findAll: (imbId: number) => repository.findAll(imbId),
  create: (data: CreateLeadDto, imbId: number) =>
    repository.insert(enrichLeadForCreation(data, imbId)),
})
```

---

## 11. Parse, Don't Validate

Parsing returns a refined type that preserves knowledge gained. Validation checks and throws away information.

```typescript
// BAD: validate then trust (knowledge lost)
function processEmail(input: string) {
  if (!isValidEmail(input)) throw new Error("Invalid email")
  // input is still `string` — compiler forgot we validated
  sendEmail(input) // accepts any string
}

// GOOD: parse into refined type (knowledge preserved)
type Email = string & { readonly __brand: "Email" }

function parseEmail(input: string): Result<Email, "INVALID_EMAIL"> {
  return EMAIL_REGEX.test(input)
    ? ok(input as Email)
    : err("INVALID_EMAIL")
}

function sendEmail(to: Email) { /* can only receive validated Email */ }

// Usage: parse at boundary, use branded type everywhere else
const result = parseEmail(rawInput)
if (result.ok) sendEmail(result.value) // type-safe
```

### Smart Constructors

```typescript
// Make it impossible to create invalid domain objects
type PositiveNumber = number & { readonly __brand: "Positive" }

function positiveNumber(n: number): Result<PositiveNumber, "NOT_POSITIVE"> {
  return n > 0 ? ok(n as PositiveNumber) : err("NOT_POSITIVE")
}

type NonEmptyArray<T> = [T, ...T[]]

function nonEmpty<T>(arr: T[]): Result<NonEmptyArray<T>, "EMPTY_ARRAY"> {
  return arr.length > 0
    ? ok(arr as NonEmptyArray<T>)
    : err("EMPTY_ARRAY")
}

// Zod IS parsing (not just validation) — use safeParse
const result = CreateLeadSchema.safeParse(rawInput)
if (!result.success) return err(result.error.flatten())
// result.data is fully typed CreateLeadDto — parsed, not just validated
```

### The Rule
- Parse at system boundaries (API input, env vars, DB results, URL params)
- Once parsed, trust the type — no re-validation deeper in the stack
- If a function needs a guarantee, encode it in the type signature

---

## 12. Total Functions

A total function returns a valid result for EVERY possible input. A partial function can crash or return undefined for some inputs.

```typescript
// PARTIAL: crashes on empty array
function head<T>(arr: T[]): T {
  return arr[0] // undefined if empty — type lies!
}

// TOTAL: return type encodes the possibility of failure
function head<T>(arr: T[]): T | undefined {
  return arr[0]
}

// TOTAL (with Result): makes caller handle both paths
function head<T>(arr: T[]): Result<T, "EMPTY_ARRAY"> {
  return arr.length > 0 ? ok(arr[0]) : err("EMPTY_ARRAY")
}

// TOTAL (with NonEmptyArray): impossible to call with empty
function head<T>(arr: NonEmptyArray<T>): T {
  return arr[0] // always safe — type guarantees at least one element
}
```

### Common Partial Functions to Avoid

```typescript
// PARTIAL → TOTAL alternatives
arr[index]                    → arr.at(index)           // returns T | undefined
map.get(key)!                 → map.get(key) ?? fallback
JSON.parse(str)               → safeParse(str)          // wrap in try, return Result
Number(str)                   → parseFloat + isNaN check
obj.deeply.nested.value       → obj?.deeply?.nested?.value
array.find(predicate)!        → handle the undefined case
parseInt(str, 10)             → validate result with isNaN

// Division: the classic partial function
function divide(a: number, b: number): Result<number, "DIVISION_BY_ZERO"> {
  return b === 0 ? err("DIVISION_BY_ZERO") : ok(a / b)
}
```

### The Rule
- If a function can fail, the return type MUST reflect it (Result, Option, T | undefined)
- Never use `!` (non-null assertion) — it converts a total function into a lie
- Prefer strengthening input types (NonEmptyArray) over weakening output types

---

## 13. Command Query Separation (CQS)

Every function should either be a **Command** (changes state, returns void) or a **Query** (returns data, no side effects). Never both.

```typescript
// BAD: mixed command + query
function getAndIncrementCounter(): number {
  counter++            // Command (side effect)
  return counter       // Query (returns data)
  // Caller can't know if calling it twice is safe
}

// GOOD: separated
function getCounter(): number { return counter }          // Query: pure, cacheable
function incrementCounter(): void { counter++ }           // Command: explicit side effect
```

### In Practice (NestJS Services)

```typescript
// Query methods: return data, no mutations
findAll(imbId: number): Promise<Lead[]>           // ✅ Query
findById(id: number, imbId: number): Promise<Lead | null>  // ✅ Query
calculateStats(leads: Lead[]): LeadStats          // ✅ Query (pure)

// Command methods: change state, return void or the new state
create(data: CreateLeadDto): Promise<Lead>        // ✅ Command (returns created entity)
updateStatus(id: number, status: LeadStatus): Promise<void>  // ✅ Command
delete(id: number): Promise<void>                 // ✅ Command

// BAD: mixed responsibilities
deleteAndReturnRemaining(id: number): Promise<Lead[]>  // ❌ Command + Query
// Split into: delete(id) then findAll()
```

### CQS in React

```typescript
// Query: pure computation, no side effects
const activeLeads = leads.filter((l) => l.status !== "perdido")
const totalValue = propostas.reduce((sum, p) => sum + p.valor, 0)

// Command: triggers side effect via mutation
const handleDelete = (id: number) => deleteLead.mutate(id)
const handleSubmit = (data: FormData) => createLead.mutate(data)

// BAD: filter that also logs (query with side effect)
const active = leads.filter((l) => { console.log(l); return l.active })
```

---

## 14. Closures as Encapsulation

Use closures and factory functions for private state — no classes needed.

```typescript
// Factory function: true privacy via closure
function createCounter(initial = 0) {
  let count = initial // truly private — no way to access from outside

  return {
    increment: () => { count++ },
    decrement: () => { count-- },
    value: () => count,
  } as const
}

const counter = createCounter(10)
counter.increment()
counter.value() // 11
// counter.count → impossible, doesn't exist on the returned object
```

### Functional Modules (replace class singletons)

```typescript
// Instead of a class with private members
function createApiClient(baseUrl: string, token: string) {
  // Private: not exposed
  const headers = { Authorization: `Bearer ${token}` }

  async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${baseUrl}${path}`, { ...options, headers })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return response.json()
  }

  // Public API: only these are accessible
  return {
    get: <T>(path: string) => request<T>(path),
    post: <T>(path: string, body: unknown) =>
      request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  }
}

const api = createApiClient("https://api.example.com", "secret-token")
api.get<Lead[]>("/leads")
// api.headers → undefined (truly private)
// api.request → undefined (truly private)
```

### When to Use Closures vs Classes
- **Closures**: when you need true privacy, functional composition, no `this` binding issues
- **Classes**: when NestJS DI requires it (controllers, services, modules — framework constraint)
- **Rule**: if you're not using NestJS DI, prefer closures over classes

---

## 15. Lenses — Immutable Deep Updates

Nested spread gets ugly fast. Lenses provide composable getters/setters for deep immutable updates.

```typescript
// The problem: nested immutable updates are painful
const updated = {
  ...state,
  leads: {
    ...state.leads,
    filters: {
      ...state.leads.filters,
      status: "qualificado",
    },
  },
}

// Lens: a pair of (get, set) for a specific path
type Lens<S, A> = {
  get: (source: S) => A
  set: (value: A) => (source: S) => S
}

function lens<S, A>(
  get: (s: S) => A,
  set: (a: A) => (s: S) => S,
): Lens<S, A> {
  return { get, set }
}

// Compose lenses for deep paths
function compose<S, A, B>(outer: Lens<S, A>, inner: Lens<A, B>): Lens<S, B> {
  return lens(
    (s) => inner.get(outer.get(s)),
    (b) => (s) => outer.set(inner.set(b)(outer.get(s)))(s),
  )
}

// Define lenses once, reuse everywhere
const leadsLens = lens<AppState, LeadsState>(
  (s) => s.leads,
  (a) => (s) => ({ ...s, leads: a }),
)

const filtersLens = lens<LeadsState, Filters>(
  (s) => s.filters,
  (a) => (s) => ({ ...s, filters: a }),
)

const statusFilterLens = compose(leadsLens, filtersLens)

// Clean usage
const updated = statusFilterLens.set({ status: "qualificado" })(state)
```

### Pragmatic Alternative: `structuredClone` + modify

```typescript
// For occasional deep updates without lens infrastructure
function updateDeep<T>(obj: T, updater: (draft: T) => void): T {
  const clone = structuredClone(obj)
  updater(clone)
  return clone
}

const updated = updateDeep(state, (draft) => {
  draft.leads.filters.status = "qualificado"
})
```

---

## 16. Lazy Evaluation

Defer computation until the result is actually needed. Avoid unnecessary work.

### Generators as Lazy Sequences

```typescript
// Eager: processes ALL items, creates intermediate arrays
const result = hugeArray
  .filter(isActive)     // new array of N items
  .map(transform)       // another new array of N items
  .slice(0, 10)         // only needed 10!

// Lazy: processes items one-by-one, stops at 10
function* lazyFilter<T>(items: Iterable<T>, predicate: (item: T) => boolean) {
  for (const item of items) {
    if (predicate(item)) yield item
  }
}

function* lazyMap<T, U>(items: Iterable<T>, fn: (item: T) => U) {
  for (const item of items) yield fn(item)
}

function take<T>(items: Iterable<T>, n: number): T[] {
  const result: T[] = []
  for (const item of items) {
    result.push(item)
    if (result.length >= n) break
  }
  return result
}

// Only processes items until we have 10 results
const result = take(lazyMap(lazyFilter(hugeArray, isActive), transform), 10)
```

### Lazy Values (deferred computation)

```typescript
// Compute-on-first-access, cache result
function lazy<T>(factory: () => T): () => T {
  let value: T | undefined
  let computed = false
  return () => {
    if (!computed) {
      value = factory()
      computed = true
    }
    return value!
  }
}

// Expensive computation only runs if needed
const expensiveStats = lazy(() => calculateComplexStats(allLeads))

// Later: only computed on first call, cached after
if (showDashboard) {
  const stats = expensiveStats() // computed here
  const again = expensiveStats() // cached — instant
}
```

---

## 17. Property-Based Testing

Instead of hand-picking examples, define properties that MUST hold for ALL inputs. The framework generates hundreds of random inputs to find violations.

```typescript
import { fc } from "fast-check"

// Example-based: tests specific cases you thought of
it("reverses an array", () => {
  expect(reverse([1, 2, 3])).toEqual([3, 2, 1])
})

// Property-based: tests the PROPERTY for any array
it("reversing twice returns original", () => {
  fc.assert(
    fc.property(fc.array(fc.integer()), (arr) => {
      expect(reverse(reverse(arr))).toEqual(arr)
    })
  )
})
```

### Properties to Test

```typescript
// Idempotency: applying twice = applying once
fc.assert(fc.property(fc.string(), (s) => {
  expect(normalize(normalize(s))).toEqual(normalize(s))
}))

// Round-trip: encode then decode = identity
fc.assert(fc.property(fc.object(), (obj) => {
  expect(JSON.parse(JSON.stringify(obj))).toEqual(obj)
}))

// Invariants: sorted output is always sorted
fc.assert(fc.property(fc.array(fc.integer()), (arr) => {
  const sorted = sortArray(arr)
  for (let i = 1; i < sorted.length; i++) {
    expect(sorted[i]).toBeGreaterThanOrEqual(sorted[i - 1])
  }
}))

// Commutativity: order doesn't matter
fc.assert(fc.property(fc.integer(), fc.integer(), (a, b) => {
  expect(add(a, b)).toEqual(add(b, a))
}))

// No-crash: function never throws for any valid input
fc.assert(fc.property(fc.string(), (s) => {
  expect(() => parseLeadStatus(s)).not.toThrow()
  // may return err(...) but must never crash
}))
```

### When to Use Property-Based Tests
- Pure functions (deterministic, no side effects)
- Serialization/deserialization (round-trip)
- Parsers and validators (no-crash, idempotency)
- Mathematical operations (commutativity, associativity)
- Data transformations (length preservation, invariants)

---

## 18. Monoids — Composable Combining

A monoid is a type with: (1) a binary combine operation, (2) an identity element. Why care? Because monoids compose naturally — combine any number of values into one.

```typescript
// Monoid interface
type Monoid<T> = {
  empty: T                          // identity element
  concat: (a: T, b: T) => T        // associative binary operation
}

// Number addition monoid
const Sum: Monoid<number> = {
  empty: 0,
  concat: (a, b) => a + b,
}

// Array monoid
const ArrayMonoid = <T>(): Monoid<T[]> => ({
  empty: [],
  concat: (a, b) => [...a, ...b],
})

// Combine any number of values
function fold<T>(monoid: Monoid<T>, values: T[]): T {
  return values.reduce(monoid.concat, monoid.empty)
}

fold(Sum, [1, 2, 3, 4]) // 10
fold(ArrayMonoid<number>(), [[1, 2], [3], [4, 5]]) // [1, 2, 3, 4, 5]
```

### Practical Uses

```typescript
// Merge configs (last wins)
const ConfigMonoid: Monoid<Partial<AppConfig>> = {
  empty: {},
  concat: (a, b) => ({ ...a, ...b }),
}

const config = fold(ConfigMonoid, [defaults, envConfig, cliArgs])

// Combine validators (all must pass)
type Validator<T> = (value: T) => string[]  // returns error messages

const ValidatorMonoid = <T>(): Monoid<Validator<T>> => ({
  empty: () => [],
  concat: (a, b) => (value) => [...a(value), ...b(value)],
})

const validateLead = fold(ValidatorMonoid<Lead>(), [
  validateName,
  validateEmail,
  validatePhone,
])

// Combine permissions
const PermissionMonoid: Monoid<Set<string>> = {
  empty: new Set(),
  concat: (a, b) => new Set([...a, ...b]),
}
```

---

## 19. Phantom Types — Compile-Time State Encoding

Use type parameters that carry NO runtime data but enforce state transitions at compile time.

```typescript
// Phantom types for request lifecycle
type Unvalidated = { readonly __state: "unvalidated" }
type Validated = { readonly __state: "validated" }
type Authorized = { readonly __state: "authorized" }

type Request<State, T> = T & { readonly __phantom: State }

// Each step narrows the phantom type
function validate<T>(req: Request<Unvalidated, T>): Result<Request<Validated, T>, string> {
  // ... validation logic
  return ok(req as unknown as Request<Validated, T>)
}

function authorize<T>(req: Request<Validated, T>): Result<Request<Authorized, T>, string> {
  // ... auth logic
  return ok(req as unknown as Request<Authorized, T>)
}

function process<T>(req: Request<Authorized, T>): Response {
  // Can ONLY receive authorized requests — compiler enforces the pipeline
  return executeBusinessLogic(req)
}

// Compile error: can't skip validation
process(rawRequest)            // ❌ Type 'Unvalidated' not assignable to 'Authorized'
process(validate(rawRequest))  // ❌ Type 'Validated' not assignable to 'Authorized'
```

### Practical: Safe HTML

```typescript
type UnsafeString = string & { readonly __html: "unsafe" }
type SafeHtml = string & { readonly __html: "safe" }

function sanitize(input: UnsafeString): SafeHtml {
  return escapeHtml(input) as SafeHtml
}

function renderToDOM(html: SafeHtml): void { /* safe to insert */ }

// renderToDOM(userInput)  // ❌ compile error — must sanitize first
renderToDOM(sanitize(userInput as UnsafeString)) // ✅
```

---

## 20. Structural Sharing — Why Immutability is Fast

Immutable updates don't copy everything. Unchanged parts share references with the original.

```
Original:           After updating user.address.city:

     state                    state'
    /     \                  /     \
  user    leads           user'    leads  ← same reference
  /  \                   /  \
name  address          name  address'     ← name same reference
      /    \                 /    \
    city   zip            city'   zip     ← zip same reference
```

### Why This Matters
- **O(log n)** updates, not O(n) copies
- **Reference equality** (`===`) for cheap change detection
- React's `memo` and `useMemo` work because unchanged objects keep the same reference
- TanStack Query's `structuralSharing` compares by reference to skip re-renders

### Rules
- Spread creates shallow copies — unchanged nested objects keep same reference automatically
- `===` comparison is instant vs deep equality which is O(n)
- NEVER deep clone when a shallow spread suffices — it breaks structural sharing
- Libraries like Immer use Proxy to auto-apply structural sharing

---

## 21. Avoid

- **Mutable shared state** — race conditions, unpredictable behavior, untestable
- **Side effects in map/filter/reduce** — these should be pure transformations
- **Exceptions for control flow** — use Result types for expected failures, exceptions for unexpected crashes
- **`void` return from functions that transform data** — if it doesn't return, it's mutating
- **Class hierarchies for behavior** — use composition (functions, interfaces)
- **`this` keyword** — binding issues, implicit state; prefer closures or explicit arguments
- **Mutable default arguments** — `function add(item, list = [])` shares the array across calls
- **forEach for transformations** — use map/filter/reduce; forEach is for side effects only
- **Non-null assertion `!`** — converts total function to partial; handle undefined instead
- **Mixed command/query** — function should either return data OR cause side effect, never both
- **Partial functions without Result/Option** — `Array.find()!`, `map.get()!`, unchecked array access
- **Deep cloning when spread suffices** — breaks structural sharing, kills React performance
- **Re-validating parsed data** — once parsed into a branded type, trust it downstream

---

## Checklist — Review for FP Compliance

### Critical
- [ ] No mutation of function arguments
- [ ] No mutable shared state between functions
- [ ] Side effects isolated at boundaries (not in business logic)
- [ ] Idempotent API endpoints where applicable (PUT, DELETE)
- [ ] Total functions — return type reflects all possible outcomes (no `!`, no unchecked access)
- [ ] Parse at boundaries, trust types downstream (parse, don't validate)

### High
- [ ] Pure functions for all business rules and calculations
- [ ] Immutable data structures (Readonly, as const, no push/splice/sort-in-place)
- [ ] Result types for operations that can fail (not thrown exceptions)
- [ ] Dependencies injected, not imported directly in pure functions
- [ ] CQS respected — functions either return data OR mutate, never both
- [ ] Closures/factory functions preferred over classes (except NestJS DI)
- [ ] Smart constructors for domain types (Email, PositiveNumber, NonEmptyArray)

### Medium
- [ ] Declarative transformations (map/filter) over imperative loops
- [ ] State transitions modeled as discriminated unions
- [ ] Data-driven lookups over if-else/switch chains
- [ ] Memoization for expensive pure computations
- [ ] Lenses or structured helpers for deep nested immutable updates
- [ ] Lazy evaluation for expensive computations not always needed
- [ ] Structural sharing preserved (no unnecessary deep clones)

### Low
- [ ] Point-free style where it improves readability
- [ ] Curried/partially applied functions for reuse
- [ ] Pipeline composition for multi-step transformations
- [ ] `as const satisfies` for immutable validated constants
- [ ] Phantom types for compile-time state enforcement where valuable
- [ ] Monoids for composable combining (configs, validators, permissions)
- [ ] Property-based tests (fast-check) for pure functions with invariants
