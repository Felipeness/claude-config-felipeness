---
name: react
description: React/Next.js best practices for modern, performant applications. Use when writing React components, hooks, Next.js pages, Server Components, or frontend architecture.
user_invocable: true
---

# React / Next.js Standards

## Architecture: Server-First

- Components are Server Components by default -- only add "use client" for interactivity
- Push "use client" to leaf components -- never mark entire feature directories
- Data fetching happens in Server Components, not useEffect
- Server Actions for mutations (replace API routes for forms)
- Colocate Server/Client split at the interactivity boundary -- a page can be a Server Component that renders a Client Component island for a button
- Server Components can import Client Components, never the reverse

## React 19 Hooks

- `useActionState`: replaces useState + useEffect for form submission state (pending, error, data in one hook)
- `useFormStatus`: child access to parent form pending state without prop drilling
- `useOptimistic`: first-class optimistic updates with automatic rollback on Server Action failure
- `use()`: unwraps Promises and Context in render (enables async Server Components and conditional context reads)
- `ref` as prop: forwardRef is no longer needed -- pass ref directly as a prop to any component
- `ref` cleanup functions: return a cleanup function from ref callbacks (replaces manual cleanup in useEffect)

## React Compiler (1.0 stable)

- Automatic memoization -- do NOT manually use useMemo, useCallback, React.memo
- Enable: `reactCompiler: true` in next.config
- Write idiomatic React and the compiler optimizes
- Rules the compiler enforces:
  - No mutating props or state directly
  - No reading refs during render (only in effects and event handlers)
  - No side effects in render (fetches, subscriptions, DOM mutations)
  - Hooks must be called unconditionally at the top level
- If the compiler cannot optimize a component, it skips it silently -- no runtime errors, just missed optimization

## Component Patterns

- Composition over prop drilling -- use children and slots (named render areas via props)
- Compound components for related UI groups (Tabs/Tab, Select/Option)
- Render props only when composition is insufficient (dynamic render logic)
- Error Boundaries around each independent data section -- one failing section does not break the page
- Each Suspense boundary wraps one data dependency with matched skeleton
- Polymorphic `as` prop with proper type inference for reusable UI primitives
- Discriminated union props for component variants -- make impossible states unrepresentable:

```tsx
type ButtonProps =
  | { variant: "link"; href: string; onClick?: never }
  | { variant: "button"; onClick: () => void; href?: never };
```

## State Management

- Server state: TanStack Query (cache, refetch, optimistic, prefetch in Server Components)
- Client state: Zustand (global UI, ~3KB) or Jotai (atomic/derived for fine-grained reactivity)
- Form state: React Hook Form + Zod resolver (parse don't validate at the boundary)
- URL state: search params (`nuqs` or `useSearchParams`) for anything shareable/bookmarkable
- Derived state > synchronized state -- compute inline, do not duplicate with useState + useEffect sync
- Zustand slices pattern for modular stores -- one slice per feature, composed into root store
- Never store server data in client state -- TanStack Query is the cache, not Zustand

## Next.js 16

- PPR (Partial Prerendering): `cacheComponents: true` -- static shell + streaming dynamic holes
- Middleware renamed to Proxy (`proxy.ts`)
- All request APIs are async-only: `await cookies()`, `await headers()`, `await params`
- Pages Router = maintenance mode -- all new code uses App Router
- View Transitions via React 19.2 (`<ViewTransition>` component)
- `after()` API for post-response work (analytics, logging) without blocking the response
- Route groups `(folder)` for layout organization without affecting URL structure

## Data Fetching

- Fetch in Server Components with async/await (never useEffect)
- Parallel fetching: sibling Server Components each fetch independently (automatic parallelism)
- Explicit parallel fetching with `Promise.all` when a single component needs multiple resources
- Streaming: wrap slow fetches in `<Suspense>` with skeleton loaders -- fast content renders immediately
- Revalidation strategies:
  - On-demand: `revalidatePath()` / `revalidateTag()` after mutations
  - Time-based: `next.revalidate` option on fetch for stale-while-revalidate
  - Tag-based: `fetch(url, { next: { tags: ['user-123'] } })` for granular invalidation
- Server Actions for mutations: type-safe, progressive enhancement, works without JS
- Cache keys: name by the query they replace, not the entity -- `userOrders-${userId}` not `orders`

## Styling

- Tailwind CSS v4: CSS-first config via `@theme`, container queries built-in
- Design tokens in `@theme` blocks mapping to Figma variables (single source of truth)
- Container queries (`@container`) over viewport breakpoints for components -- components should not know where they are placed
- CSS `:has()` for parent-aware styling without JS
- `cn()` utility (clsx + tailwind-merge) for conditional class composition
- Never inline Tailwind strings conditionally with template literals -- use cn() or cva()
- Class Variance Authority (cva) for component variant styles with type-safe API

## Performance

- Core Web Vitals targets: INP < 200ms, LCP < 2.5s, CLS < 0.1
- `startTransition` for non-urgent updates (keeps UI responsive during heavy renders)
- Dynamic imports for heavy components: `next/dynamic` with explicit loading skeleton
- Image optimization: `next/image` with `sizes` prop (automatic WebP/AVIF, responsive srcset)
- Font optimization: `next/font` with `display: 'swap'` and `preload: true`
- Bundle analysis: `@next/bundle-analyzer` -- monitor per-route JS size
- Virtualization for long lists: `@tanstack/react-virtual` (not full-page scroll)
- `React.lazy` + Suspense for code splitting at route boundaries
- Avoid layout thrashing: batch DOM reads before writes, use `useLayoutEffect` only for measurements

## Accessibility

- Semantic HTML first: `<button>`, `<nav>`, `<main>`, `<article>`, `<aside>`, `<dialog>`
- ARIA only when semantic HTML is insufficient -- `aria-live` for dynamic content, `aria-expanded` for disclosure
- Keyboard navigation for all interactive elements (focus management, focus trapping in modals)
- `eslint-plugin-jsx-a11y` in CI -- zero tolerance for violations
- `axe-core` in Playwright E2E tests for automated accessibility checks
- Color contrast: WCAG AA minimum (4.5:1 text, 3:1 large text/UI)
- Reduced motion: `prefers-reduced-motion` media query for animations
- Focus visible: `:focus-visible` over `:focus` for keyboard-only focus indicators

## Testing

- Vitest Browser Mode for component tests (real browser, not jsdom -- accurate DOM, CSS, events)
- Testing Library for user-centric queries: `getByRole` > `getByText` > `getByTestId` (testid is last resort)
- Playwright for E2E: critical user journeys only, 10-20 flows max (login, checkout, CRUD operations)
- MSW for network mocking: single source of truth for API mocks across tests + Storybook + development
- Server Components: test data layer as pure functions, test rendered output via integration tests
- Test naming: 3rd person verbs describing behavior -- `rendersEmptyStateWhenNoItems`, `submitsFormWithValidData`
- Test location: colocated with source (`.test.tsx` next to `.tsx`), not in `__tests__/` directory
- Table-driven tests for variations:

```tsx
it.each([
  { role: "admin", visible: true },
  { role: "viewer", visible: false },
])("$role sees delete button: $visible", ({ role, visible }) => {
  // ...
});
```

- Never test implementation details (state shape, hook internals) -- test behavior and output
- Storybook for visual component documentation and visual regression (Chromatic or similar)

## Hooks Discipline

- Custom hooks for reusable stateful logic, not for "organizing" a single component
- Hooks extract shared behavior -- if a hook is used in one place, inline it
- Keep hooks focused: one concern per hook (useAuth, useDebounce, useMediaQuery)
- Never call hooks conditionally or in loops -- extract conditional logic inside the hook
- Prefer composition of small hooks over monolithic hooks with many return values
- Custom hooks that wrap TanStack Query should return the query result directly (no re-wrapping)

## Error Handling

- Error Boundaries at feature boundaries -- each independent section recovers independently
- `error.tsx` in Next.js App Router for route-level error recovery with retry
- Server Action errors: return typed error objects, never throw for expected business errors
- Result pattern for expected errors: `{ success: true, data } | { success: false, error }` -- not exceptions
- Global error boundary at app root as last resort with "something went wrong" + report button
- Validate at the boundary (Zod schemas on form data, API responses), trust internally

## TypeScript Integration

- Strict mode always: `strict: true` in tsconfig
- Component props: explicit types, never `any` -- discriminated unions for variants
- Event handlers: use React's built-in types (`React.MouseEvent<HTMLButtonElement>`)
- `satisfies` over `as` for type validation without widening
- Generic components with proper constraints for reusable typed components
- Server Action return types: explicit `Promise<ActionResult<T>>` with discriminated union

## Anti-patterns

- No `useEffect` for data fetching -- use Server Components or TanStack Query
- No `useState` + `useEffect` for derived state -- compute inline or useMemo only if profiler confirms slowness
- No manual memoization (useMemo, useCallback, React.memo) -- React Compiler handles this
- No prop drilling beyond 2 levels -- use composition (children), Context, or Zustand
- No `index` as key in dynamic lists -- use stable unique identifiers
- No string refs -- use `useRef` (or ref as prop in React 19)
- No `dangerouslySetInnerHTML` without DOMPurify sanitization
- No `any` in component props or hook return types
- No barrel files (index.ts) for component re-exports -- import directly from the source file
- No client-side fetching for data available at request time -- use Server Components
- No global CSS class names without module scoping or Tailwind -- avoid style collisions
- No `useEffect` for event subscriptions that should be event handlers (onClick, onSubmit)
- No fire-and-forget promises in event handlers -- handle errors and show feedback
