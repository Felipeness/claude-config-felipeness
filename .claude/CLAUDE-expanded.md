## Git Workflow
- Do not include Claude Code in commit messages
- Use conventional commits (be brief and descriptive)

# Software Engineering Concepts
- type-safety (aim for e2e type-safety)
- monitoring/observability/profiling/tracing
- simplicity (KISS, YAGNI, 1 idea per sentence, no clutter/filler words)
- descriptive naming (avoid vague terms: data, item, list, component, info)
- functional programming (immutability, high order functions)
- automated testing (prevents bug re-occurrence, makes changes safer)
- error-handling (always provide user feedback and log errors with observability tools)
- writing (1 idea per sentence, no clutter/filler, lead with result, use active voice, prefer smaller words, no emojis unless asked)
- automation (use CI pipelines to validate builds and tests)
- focus on:
  - e2e type-safety
  - observability (tracing, profiling)
  - accessibility, a11y, strive for WCAG 2.0 guidelines
  - security, follow OWASP best practices
- comments are unnecessary 98% of the time, convert them to be a function/variable instead
- don't write pure SQL strings, use query-builders for SQL-injection protection
- use HighOrderFunctions for monitoring/error handling/profiling
- avoid premature optimization
- every character must earn its place
- code is reference, history and functionality - must be readable as a journal
- be concrete and specific: `retryAfterMs` > `timeout`, `emailValidator` > `validator`
- use nested objects to provide context: `config.public.ENV_NAME` instead of `ENV_NAME`
- avoid useless abstractions (functions that mainly call one function, helper used only once)
- keep code close to where it's used, unless used 2-3+ times
- a folder with a single file should be a single file

# TypeScript/JavaScript
- use strict typescript, no any, almost never use "as"
- use pre-commit hooks for linting/parsing/removing dead code with knip
- prefer types over interfaces
- leave types close to where they're used
- aim for e2e type-safety
- let the compiler infer response types whenever possible
- always use named exports; don't use default exports unless you have to
- don't create an index file only for exports
- prefer await/async over Promise().then()
- unused vars should start with _ (or don't exist at all)
- prefer string literals over string concatenation
- don't abbreviate; use descriptive names
- always use early return over if-else
- prefer hash-lists over switch-case
- follow programming language naming conventions (SNAKE_CAPS for constants, camelCase for functions, kebab-case for file names)
- avoid indentation levels, strive for flat code
- remove redundancy: `users` not `userList`
- avoid suffixes like Manager, Helper, Service unless essential
- prefer concise names: `retryCount` over `maximumNumberOfTimesToRetryBeforeGivingUpOnTheRequest`

# React/Next
- use react 19 best practices (suspense, hook "use", promises as props)
- use react query to fetch async data on the client-side
- don't declare constants or functions inside components; keep them pure
- don't fetch data in useEffect, use React Query
  - you probably shouldn't use useEffect
  - use `use`, `useTransition` and `startTransition` instead of useEffect
- don't use magic strings for cache tags; use an enum/factory
- don't use magic numbers/strings
- use enum for react query cache strings
- prefer <Suspense> and useSuspenseQuery over react query isLoading
- use errorBoundary with retry button

# Testing
- always test behavior, never test implementation
- don't use should, use 3rd person verbs
- write a test for each bug you fix to ensure no re-occurrence
- use describe clauses: segment the test file as feature behavioral

# Writing
- be concise, 1 idea per sentence, each word must earn its place
- prefer active voice: "We fixed the bug" over "The bug was fixed by us"
- prefer short sentences
- lead with result, return early, make outcomes obvious
- cut the clutter: delete redundant words in names and code

