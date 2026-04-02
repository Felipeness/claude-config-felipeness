---
name: typescript
description: TypeScript/JavaScript standards for type-safe, maintainable code. Use when writing any TS/JS code including Node.js, React, NestJS.
user_invocable: true
---

# TypeScript/JavaScript Standards

## Type Safety Fundamentals

- `strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` always enabled
- Never use `any` -- use `unknown` with type guards or explicit types (HARD rule)
- Never use `as` for type casting -- write narrowing/type guards instead (exception: test factories where casting simplifies setup)
- Never use `!` non-null assertion -- handle undefined explicitly (HARD rule)
- Prefer `satisfies` over type annotation when you want inference + validation
- Prefer types over interfaces -- interfaces are for declaration merging only (rare)
- Let the compiler infer response types whenever possible -- avoid redundant annotations
- Aim for e2e type-safety: API to Database to UI

```typescript
// Bad
const user = data as User;
const name = user!.name;
const value: any = getResponse();

// Good
const user = parseUser(data); // returns User or throws
const name = user?.name ?? 'unknown';
const value: unknown = getResponse();
if (isUser(value)) { /* narrowed */ }

// satisfies: inference + validation
const config = {
  port: 3000,
  host: 'localhost',
} satisfies ServerConfig; // infers literal types, validates shape
```

## Branded Types & Phantom Types

- Use branded types to prevent primitive obsession: `UserId` cannot be assigned where `PostId` is expected
- Pattern: `type UserId = string & { readonly __brand: 'UserId' }`
- With Zod: `z.string().uuid().brand('UserId')`
- With Effect Schema: `Schema.String.pipe(Schema.brand("UserId"))`
- Use constructor functions that validate and brand in one step

```typescript
type UserId = string & { readonly __brand: 'UserId' };
type PostId = string & { readonly __brand: 'PostId' };

const UserId = (id: string): UserId => {
  if (!isValidUuid(id)) throw new Error(`invalid user id: ${id}`);
  return id as UserId; // `as` acceptable only in brand constructors
};

// Compile-time safety
function getPost(userId: UserId, postId: PostId): Post { /* ... */ }
getPost(postId, userId); // compile error -- swapped args caught
```

## Discriminated Unions

- States that cannot coexist must be separate union members
- Use `_tag` or `type` as discriminant field
- Exhaustive matching via ts-pattern `.exhaustive()` or never assertion
- Never use boolean flags for states -- `{ loading: boolean; error: Error | null; data: T | null }` is 8 possible states when only 3 are valid

```typescript
// Bad: 8 possible states, only 3 valid
type State = {
  loading: boolean;
  error: Error | null;
  data: User | null;
};

// Good: exactly 3 states, impossible states irrepresentable
type State =
  | { _tag: 'loading' }
  | { _tag: 'error'; error: AppError }
  | { _tag: 'success'; data: User };

// Exhaustive matching
import { match } from 'ts-pattern';

const render = (state: State) =>
  match(state)
    .with({ _tag: 'loading' }, () => <Spinner />)
    .with({ _tag: 'error' }, ({ error }) => <ErrorView error={error} />)
    .with({ _tag: 'success' }, ({ data }) => <UserCard user={data} />)
    .exhaustive();
```

## Result/Either Pattern

- Business errors as typed return values, not exceptions
- Exceptions only for system errors (unrecoverable)
- Simple pattern: `type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }`
- For Effect users: `Effect<Success, Error, Requirements>`

```typescript
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

type CreateUserError =
  | { _tag: 'email_taken'; email: string }
  | { _tag: 'invalid_domain'; domain: string };

function createUser(input: CreateUserInput): Result<User, CreateUserError> {
  if (emailExists(input.email)) {
    return { ok: false, error: { _tag: 'email_taken', email: input.email } };
  }
  return { ok: true, value: persistUser(input) };
}

// Caller handles all cases explicitly
const result = createUser(input);
if (!result.ok) {
  return match(result.error)
    .with({ _tag: 'email_taken' }, (e) => conflict(`email ${e.email} already registered`))
    .with({ _tag: 'invalid_domain' }, (e) => badRequest(`domain ${e.domain} not allowed`))
    .exhaustive();
}
```

## Parse Don't Validate (Zod / Effect Schema)

- Validate at system boundaries (API input, env vars, external data)
- Return parsed typed objects, not booleans
- Trust validated types internally -- no re-validation in deeper layers
- Zod v4: 14x faster, Standard Schema compatible
- Effect Schema: bidirectional (encode + decode), branded types built-in

```typescript
// Bad: validates but returns boolean, type stays unknown
function isValidUser(data: unknown): boolean { /* ... */ }

// Good: parses and returns typed object or throws
const CreateUserInput = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(['admin', 'user'] as const),
});
type CreateUserInput = z.infer<typeof CreateUserInput>;

// At the boundary
const input = CreateUserInput.parse(req.body); // typed, safe
// Internally: trust the type, no re-validation
```

## Modern TS Features (5.8+)

- `using` / `await using` for resource cleanup (`Symbol.dispose`)
- `satisfies` for type-safe inference without widening
- `const` type parameters for literal inference
- `NoInfer<T>` to prevent unwanted inference in generics
- `erasableSyntaxOnly` for Node.js native TS execution compatibility (enums break this)

```typescript
// using: automatic cleanup
await using connection = await db.connect();
// connection.dispose() called automatically at end of scope

// const type parameters: literal inference
function createRoute<const T extends readonly string[]>(paths: T): T {
  return paths;
}
const routes = createRoute(['/home', '/about']); // type: readonly ['/home', '/about']

// NoInfer: prevent unwanted inference
function createFSM<S extends string>(initial: S, transitions: Record<S, NoInfer<S>[]>) { /* ... */ }
```

## as const Objects > Enums

- Enums generate runtime code, have reverse mapping surprises, and break `erasableSyntaxOnly`
- `as const` objects are tree-shakeable, transparent, and work with native TS execution
- Pattern: define object, extract type from values

```typescript
// Bad: TypeScript enum
enum Status { Active = 'active', Inactive = 'inactive' }

// Good: as const object
const Status = {
  Active: 'active',
  Inactive: 'inactive',
} as const;
type Status = typeof Status[keyof typeof Status]; // 'active' | 'inactive'

// Usage is identical
function isActive(status: Status): boolean {
  return status === Status.Active;
}
```

## Exhaustive Matching

- ts-pattern `.exhaustive()` for complex matching with nested patterns
- Switch + never assertion for simple discriminated unions
- Always handle all union members -- never use `default` to swallow unknown cases

```typescript
// Simple: never assertion in switch
function assertNever(value: never): never {
  throw new Error(`unhandled case: ${JSON.stringify(value)}`);
}

function handleAction(action: Action): void {
  switch (action._tag) {
    case 'create': return handleCreate(action);
    case 'update': return handleUpdate(action);
    case 'delete': return handleDelete(action);
    default: assertNever(action); // compile error if a case is missing
  }
}
```

## Imports & Modules

- Direct imports from source file > barrel files (tree-shaking, no circular deps)
  - Exception: boundary of a published package/lib where barrel file IS the API surface
- Named exports > default exports (except Next.js pages/layouts that require default)
- `verbatimModuleSyntax` for clean ESM/CJS separation
- Use `.js` extension in imports for Node.js native TS execution
- Do not create index files only for re-exports

```typescript
// Bad: barrel file import
import { UserService, UserRepository } from './user';

// Good: direct imports
import { UserService } from './user/user.service.js';
import { UserRepository } from './user/user.repository.js';
```

## Utility Patterns

- `Record<string, T>` for dynamic key objects (never plain object type)
- `Map` for runtime key-value when keys are dynamic -- better perf than object for frequent additions/deletions
- `Readonly<T>` / `ReadonlyArray<T>` / `readonly` for immutable interfaces
- Template literal types for type-safe string patterns
- Conditional types and mapped types for DRY type definitions
- Unused vars should start with `_` (or be removed entirely)

```typescript
// Template literal types
type EventName = `on${Capitalize<'click' | 'hover' | 'focus'>}`;
// 'onClick' | 'onHover' | 'onFocus'

// Mapped types for DRY
type Nullable<T> = { [K in keyof T]: T[K] | null };
type UpdateInput<T> = Partial<Omit<T, 'id' | 'createdAt'>>;
```

## Error Handling

- try/catch only at system boundaries -- not wrapping every function
- Custom error classes extend `Error` with typed `code` field for programmatic handling
- Error context without "failed to" stacking: `"create user: ${cause}"`
- Always re-throw or handle -- empty catch blocks are forbidden (HARD rule)
- Never engulf errors silently

```typescript
class AppError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Context without stacking "failed to"
try {
  await db.insert(user);
} catch (cause) {
  throw new AppError('USER_CREATE', `create user ${user.id}: ${cause}`, cause);
}
```

## Async Patterns

- `Promise.all` for independent operations (never sequential await for independent work)
- `Promise.allSettled` when partial failure is acceptable
- `p-limit` for bounded parallelism -- never unbounded `Promise.all` with N items (HARD rule)
- `AbortController` for cancellation in long operations
- Always set explicit timeouts on external calls -- never trust lib defaults (HARD rule)

```typescript
// Bad: sequential when independent
const users = await getUsers();
const posts = await getPosts();

// Good: parallel
const [users, posts] = await Promise.all([getUsers(), getPosts()]);

// Good: bounded parallelism for N items
import pLimit from 'p-limit';
const limit = pLimit(5);
const results = await Promise.all(
  items.map((item) => limit(() => processItem(item))),
);

// Good: timeout on external call
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 5000);
try {
  const response = await fetch(url, { signal: controller.signal });
} finally {
  clearTimeout(timeout);
}
```

## Code Structure & Naming

- Always use early return + guard clauses -- happy path at the end, minimal indentation
- Nesting max 2 levels -- extract function at the 3rd
- Hash maps/strategy maps > switch/if-else chains -- extensible, testable
- Functions < 20 lines, max 3 parameters (use object if more) -- heuristic, not law
- Descriptive names > comments: `retryAfterMs` > `timeout`, `userPayments` > `data`
- Don't abbreviate; use descriptive names
- Comments only for WHY, never WHAT

```typescript
// Bad: nested, hard to follow
function processOrder(order: Order) {
  if (order.status === 'pending') {
    if (order.items.length > 0) {
      if (order.total > 0) {
        // process...
      }
    }
  }
}

// Good: guard clauses, flat
function processOrder(order: Order) {
  if (order.status !== 'pending') return;
  if (order.items.length === 0) return;
  if (order.total <= 0) return;

  // happy path: process...
}

// Good: strategy map > switch chain
const handlers: Record<OrderStatus, (order: Order) => void> = {
  pending: processPending,
  confirmed: processConfirmed,
  shipped: processShipped,
  delivered: processDelivered,
};

handlers[order.status](order);
```

## Naming Conventions

- `SNAKE_CAPS` for constants: `MAX_RETRY_COUNT`
- `camelCase` for functions and variables: `getUserById`
- `PascalCase` for types, interfaces, classes: `UserService`
- `kebab-case` for files: `user-service.ts`
- Avoid redundant names: `users` not `userList`
- Avoid suffixes like Manager, Helper unless essential
- Avoid over-long names: `retryCount` over `maximumNumberOfTimesToRetryBeforeGivingUp`
- Magic strings/numbers: extract to named constants

## Immutability & Functional Style

- `const` / `readonly` by default -- mutability is opt-in
- Declarative > imperative: `.map/.filter/.reduce` > `for` loops
- Composition > inheritance -- always (except Liskov genuine or framework requirement like `extends Error`)
- Funções puras for business logic, side effects isolated at the edges (Functional Core / Imperative Shell)
- CQS: query OR command, never both (exception: atomic ops like `pop`, `getOrCreate`, `compareAndSwap`)

```typescript
// Bad: mutation
const active: User[] = [];
for (const user of users) {
  if (user.isActive) active.push(user);
}

// Good: declarative
const active = users.filter((user) => user.isActive);

// Complex conditions: extract to named predicate
const isEligibleForPromotion = (user: User): boolean =>
  user.isActive && user.tenure > 2 && user.performance === 'excellent';

const promoted = users.filter(isEligibleForPromotion);
```

## Testing

- Vitest over Jest (NestJS 11 default, faster, better ESM support)
- Test naming: 3rd person verbs describing behavior, no "should" -- `createsUserWithValidEmail`, `rejectsInvalidPayment`
- Test location: colocated with source (`.test.ts` beside `.ts`), not in `__tests__/`
- Table-driven tests for input/output variations -- eliminates copy-paste
- Property-based testing with `@fast-check/vitest` for invariants (financial calcs, serialization roundtrips)
- Integration > Unit for services. Unit only for pure functions with complex business logic
- Testcontainers for real DB in integration tests -- zero shared state
- Mock what you don't control (external APIs, clocks), fake what you control (repos with in-memory impl). Never mock what you're testing

```typescript
// Table-driven test
it.each([
  { input: 'valid@email.com', expected: true },
  { input: 'no-at-sign', expected: false },
  { input: '', expected: false },
  { input: 'a@b.c', expected: true },
])('validatesEmail($input) returns $expected', ({ input, expected }) => {
  expect(isValidEmail(input)).toBe(expected);
});

// Property-based test
test.prop([fc.integer(), fc.integer()])('addition is commutative', (a, b) => {
  expect(add(a, b)).toBe(add(b, a));
});
```

## Performance

- Avoid unnecessary intermediate arrays: chaining `.filter().map()` creates 2 arrays
- Use `for...of` when you need early break with accumulated state
- Lazy evaluation with generators/iterators for large datasets
- No N+1 queries -- batch fetch, not loop fetch
- No queries without LIMIT/pagination -- `SELECT *` without limit is a production bomb
- Profile before optimizing -- premature optimization is the root of all evil

## Logging & Observability

- Log levels as contract: ERROR = pages someone, WARN = investigate eventually, INFO = business event, DEBUG = dev context
- JSON structured with `requestId`, `userId`, `operation`, `durationMs`
- Never log PII, tokens, or passwords

## Cache Strategy

- Cache keys named by the query they replace, not by entity
- TTL: short for volatile data, long for reference data, indefinite with explicit invalidation for aggregates

## NestJS Specific

- Use query-builders (Prisma, Drizzle, TypeORM query builder) instead of raw SQL for type-safety and injection protection
- Composition via modules/providers -- avoid deep inheritance chains
- Guards, interceptors, pipes at the boundary -- trust validated data internally
- Custom decorators for cross-cutting concerns (auth, tenant, tracing)

## Tooling

- Use pre-commit hooks for linting/formatting/dead-code removal
- ESLint + Prettier (or Biome for unified lint+format)
- `verbatimModuleSyntax` in tsconfig for clean import types
