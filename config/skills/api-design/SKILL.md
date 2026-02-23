---
name: api-design
description: Type-safe REST/webhook API design patterns for Node.js microservices. Use when designing endpoints, webhook handlers, API contracts, or inter-service communication. Focuses on type-safety, validation, idempotency, and error handling.
---

# API Design Guidelines

Standards for building type-safe, resilient APIs and webhook systems.

## Endpoint Design

### URL Structure
- Use nouns, not verbs: `/users` not `/getUsers`
- Plural resources: `/users`, `/payments`, `/webhooks`
- Nested for relationships: `/users/:id/payments`
- Use kebab-case: `/webhook-events` not `/webhookEvents`

### HTTP Methods
- `GET`: Read (idempotent, cacheable)
- `POST`: Create or trigger action
- `PUT`: Full replace (idempotent)
- `PATCH`: Partial update
- `DELETE`: Remove (idempotent)

### Response Codes
- `200`: Success
- `201`: Created (with Location header)
- `204`: No content (successful delete)
- `400`: Bad request (validation failed)
- `401`: Unauthorized (no/invalid token)
- `403`: Forbidden (valid token, no permission)
- `404`: Not found
- `409`: Conflict (duplicate, state mismatch)
- `422`: Unprocessable (valid syntax, invalid semantics)
- `429`: Rate limited
- `500`: Internal error (never expose internals)

## Type-Safe Contracts

### Request Validation
```typescript
// Always validate at the boundary with Zod
const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
})

type CreateUserInput = z.infer<typeof CreateUserSchema>
```

### Response Typing
```typescript
// Define response types explicitly
type ApiResponse<T> = {
  data: T
  meta?: { page: number; total: number }
}

type ApiError = {
  code: string
  message: string
  details?: Record<string, string[]>
}
```

### Avoid
- Raw `any` in request/response types
- String-based status codes
- Unvalidated query parameters
- Exposing internal IDs or stack traces

## Webhook Design

### Receiving Webhooks
- Always verify signatures (HMAC, shared secret)
- Return `200` immediately, process async
- Store raw payload before processing
- Implement idempotency (deduplicate by event ID)

### Sending Webhooks
- Include event type, timestamp, and unique ID
- Sign payloads with HMAC-SHA256
- Retry with exponential backoff (1s, 2s, 4s, 8s, 16s)
- Set reasonable timeouts (5-10s)
- Log delivery attempts and responses

### Webhook Payload Structure
```typescript
type WebhookEvent<T> = {
  id: string           // unique event ID (for idempotency)
  type: string         // e.g. "payment.completed"
  timestamp: string    // ISO 8601
  data: T              // typed payload
}
```

## Error Handling

### Consistent Error Format
```typescript
// All errors follow the same shape
{
  code: "VALIDATION_ERROR",
  message: "Email already registered",
  details: { email: ["must be unique"] }
}
```

### Error Mapping
- Map internal errors to safe API errors
- Never expose database errors, file paths, or stack traces
- Log full error internally, return sanitized error to client

## Inter-Service Communication

### Patterns
- Use typed HTTP clients (got, axios with interceptors)
- Centralize base URL and auth config
- Add request/response logging with correlation IDs
- Set timeouts per service (don't use defaults)
- Circuit breaker for unreliable dependencies

### Correlation IDs
- Generate at the gateway, propagate through all services
- Include in every log entry
- Return in response headers for debugging

## Rate Limiting

- Apply per endpoint and per client
- Return `429` with `Retry-After` header
- Implement at gateway level, not per service
- Use sliding window or token bucket algorithm

## Pagination

- Use cursor-based for large datasets (not offset)
- Always set a max page size
- Return `meta` with total count and next cursor
```typescript
type PaginatedResponse<T> = {
  data: T[]
  meta: {
    cursor: string | null
    hasMore: boolean
    total: number
  }
}
```

## Versioning

- Use URL prefix: `/v1/users`
- Only bump version for breaking changes
- Maintain previous version for migration period
- Document breaking changes clearly
