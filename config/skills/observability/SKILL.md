---
name: observability
description: Implementing monitoring, logging, tracing, and error tracking for Node.js microservices. Use when adding observability to APIs, webhooks, background jobs, or any production system. Covers structured logging, distributed tracing, metrics, and alerting.
---

# Observability Guidelines

Make systems debuggable in production. If you can't observe it, you can't fix it.

## Three Pillars

### 1. Logs (What happened)
### 2. Traces (Where it happened across services)
### 3. Metrics (How much / how often)

## Structured Logging

### Format
Always use structured JSON logs, never plain strings:
```typescript
// Good: structured, searchable, filterable
logger.info('Payment processed', {
  userId: 'u_123',
  amount: 5000,
  currency: 'BRL',
  provider: 'stripe',
  durationMs: 340,
})

// Bad: unstructured, unsearchable
console.log(`Payment of 5000 processed for user u_123`)
```

### Log Levels
- `error`: Something failed and needs attention
- `warn`: Unexpected but handled (retries, fallbacks)
- `info`: Business events (payment created, user registered)
- `debug`: Technical details (only in dev, never in prod)

### What to Log
- Request/response at service boundaries (sanitized)
- Business events (created, updated, deleted, failed)
- External service calls (API, database, queue)
- Retry attempts and circuit breaker state changes
- Duration of critical operations

### What NOT to Log
- Passwords, tokens, secrets, PII
- Full request/response bodies (too verbose)
- Success of every trivial operation
- Anything at `debug` level in production

## Distributed Tracing

### Correlation IDs
```typescript
// Generate at gateway, propagate everywhere
const correlationId = req.headers['x-correlation-id'] || crypto.randomUUID()

// Include in all logs
logger.info('Processing webhook', { correlationId, eventType })

// Forward to downstream services
await httpClient.post(url, payload, {
  headers: { 'x-correlation-id': correlationId }
})
```

### Span Pattern
```typescript
// Wrap critical operations
const span = tracer.startSpan('processPayment')
try {
  const result = await processPayment(input)
  span.setStatus({ code: SpanStatusCode.OK })
  return result
} catch (error) {
  span.setStatus({ code: SpanStatusCode.ERROR, message: error.message })
  throw error
} finally {
  span.end()
}
```

## Error Tracking

### Integration (Sentry, Rollbar, etc.)
- Capture unhandled exceptions globally
- Add user context (ID, not PII)
- Add request context (URL, method, status)
- Tag by service, environment, version
- Set alert thresholds (don't alert on every error)

### Error Context
```typescript
// Always add context before throwing/reporting
Sentry.withScope(scope => {
  scope.setTag('service', 'webhook-gateway')
  scope.setExtra('eventType', event.type)
  scope.setExtra('retryCount', retryCount)
  Sentry.captureException(error)
})
```

## Higher Order Functions for Monitoring

```typescript
// Wrap any async operation with timing + error tracking
function withMonitoring<T>(
  operationName: string,
  fn: () => Promise<T>,
): Promise<T> {
  const start = performance.now()
  return fn()
    .then(result => {
      const durationMs = performance.now() - start
      logger.info(`${operationName} completed`, { durationMs })
      metrics.histogram(`${operationName}.duration`, durationMs)
      return result
    })
    .catch(error => {
      const durationMs = performance.now() - start
      logger.error(`${operationName} failed`, { durationMs, error: error.message })
      metrics.increment(`${operationName}.errors`)
      throw error
    })
}
```

## Health Checks

Every service needs:
```typescript
// GET /health - lightweight (for load balancer)
{ status: 'ok', uptime: 12345 }

// GET /health/detailed - includes dependencies
{
  status: 'ok',
  database: 'connected',
  redis: 'connected',
  externalApi: 'degraded',
}
```

## Alerting Rules

- **Critical**: Service down, error rate > 5%, latency p99 > 5s
- **Warning**: Error rate > 1%, latency p95 > 2s, disk > 80%
- **Info**: Deployment completed, config changed

### Avoid
- Alerting on every error (alert fatigue)
- No runbook attached to alerts
- Alerts without actionable resolution steps
- Too many notification channels
