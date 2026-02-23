---
name: debugging
description: Structured debugging workflow using MCP tools (Chrome, Playwright, console). Use when investigating bugs, runtime errors, unexpected behavior, or performance issues. Applies to both frontend and backend debugging.
---

# Debugging Guidelines

Systematic approach to finding and fixing bugs. Stop guessing, start proving.

## Process

### 1. Reproduce
- Get the exact steps to trigger the bug
- Identify: expected behavior vs actual behavior
- Check if it's consistent or intermittent

### 2. Isolate
- Narrow the scope: which layer? (API, database, frontend, network)
- Binary search: comment out halves until the culprit is found
- Check recent changes: `git log --oneline -20` and `git diff`

### 3. Inspect

#### Backend Debugging
- Add structured logs at suspected points (remove after fixing)
- Check error monitoring tools (Sentry, LogRocket) for stack traces
- Inspect request/response payloads
- Verify database state matches expectations
- Check environment variables and config

#### Frontend Debugging (Browser MCP)
- **Console**: Read errors and warnings with `read_console_messages`
- **Network**: Inspect API calls with `read_network_requests`
- **DOM**: Read page structure with `read_page`
- **Screenshots**: Capture visual state for comparison
- Never console.log in production; use structured logging

#### Common Traps
- Cached data masking the real state
- Race conditions (timing-dependent bugs)
- Environment differences (dev vs prod config)
- Silent failures (swallowed errors, empty catch blocks)

### 4. Prove the Root Cause
- Write a failing test that reproduces the bug BEFORE fixing
- The test should fail now and pass after the fix
- If you can't write a test, you might not understand the bug yet

### 5. Fix
- Fix the root cause, not the symptom
- Keep the fix minimal and focused
- Don't refactor unrelated code in the same commit

### 6. Verify
- Run the failing test (it should pass now)
- Check for regressions in related functionality
- Verify in the same environment where the bug was found

## Anti-Patterns

- **Shotgun debugging**: Changing random things hoping something works
- **Print-and-pray**: Adding logs everywhere without a hypothesis
- **Fix-and-forget**: Fixing without writing a regression test
- **Blame the framework**: Check your code first, then the library
- **Silent swallowing**: `catch (e) {}` hides the real problem

## Error Message Format

When logging errors for debugging:
```typescript
// Good: context + error + state
logger.error('Payment failed', {
  userId,
  amount,
  provider: 'stripe',
  error: err.message,
  stack: err.stack,
})

// Bad: useless
console.log('error', e)
```

## Webhook/API Debugging

For microservice and webhook systems:
- Log request ID across services for tracing
- Check timeout values (gateway vs upstream)
- Verify retry logic and idempotency
- Inspect payload format mismatches between services
- Check authentication tokens and expiry
