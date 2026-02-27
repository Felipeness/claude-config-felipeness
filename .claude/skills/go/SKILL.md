---
name: go
description: Go standards for writing idiomatic, type-safe, performant Go code. Use when writing Go APIs, CLIs, or services. Covers error handling, naming, project structure, concurrency, and testing patterns.
---

# Go Standards

Write idiomatic Go. Simple, explicit, no magic.

## Core Principles

- Explicit over implicit (no hidden behavior)
- Accept interfaces, return structs
- Errors are values, not exceptions
- Small interfaces (1-3 methods)
- Package names are short, lowercase, no underscores

## Error Handling

### Always Handle Errors
```go
// Good: handle every error
result, err := doThing()
if err != nil {
    return fmt.Errorf("doThing failed: %w", err)
}

// Bad: ignoring errors
result, _ := doThing()
```

### Wrap Errors with Context
```go
// Good: wraps with context for stack trace
if err != nil {
    return fmt.Errorf("processing user %s: %w", userID, err)
}

// Bad: no context
if err != nil {
    return err
}
```

### Custom Errors
```go
// Use sentinel errors for expected failures
var ErrNotFound = errors.New("not found")
var ErrUnauthorized = errors.New("unauthorized")

// Check with errors.Is
if errors.Is(err, ErrNotFound) {
    // handle not found
}
```

## Naming

- Short, descriptive names: `srv` not `server` for local vars
- Exported names start with uppercase
- Interfaces end with `-er`: `Reader`, `Writer`, `Handler`
- Avoid `Get` prefix: `user.Name()` not `user.GetName()`
- Package name provides context: `http.Client` not `http.HTTPClient`
- Single-method interfaces: name after the method

## Project Structure

```
cmd/
  api/main.go          # entrypoint
internal/
  user/
    handler.go         # HTTP handlers
    service.go         # business logic
    repository.go      # data access
    user.go            # types and domain
  webhook/
    handler.go
    processor.go
pkg/                   # shared, importable code
  httputil/
  validation/
```

- `internal/`: Private to this module
- `pkg/`: Importable by other projects
- `cmd/`: Entrypoints only (thin, just wiring)

## Concurrency

### Goroutines
```go
// Always handle goroutine lifecycle
g, ctx := errgroup.WithContext(ctx)
g.Go(func() error {
    return processItem(ctx, item)
})
if err := g.Wait(); err != nil {
    return err
}
```

### Channels
- Prefer `errgroup` over raw goroutines + channels
- Buffered channels for known producer/consumer rates
- Always close channels from the sender side
- Use `context.Context` for cancellation, not channel signals

### Avoid
- Goroutine leaks (always ensure exit path)
- Shared mutable state (use channels or sync.Mutex)
- `sync.WaitGroup` when `errgroup` works

## HTTP APIs

```go
// Handler signature
func (h *UserHandler) Create(w http.ResponseWriter, r *http.Request) {
    var input CreateUserInput
    if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
        http.Error(w, "invalid request body", http.StatusBadRequest)
        return
    }

    if err := input.Validate(); err != nil {
        respondJSON(w, http.StatusUnprocessableEntity, ApiError{
            Code:    "VALIDATION_ERROR",
            Message: err.Error(),
        })
        return
    }

    user, err := h.service.Create(r.Context(), input)
    if err != nil {
        // handle specific errors
        return
    }

    respondJSON(w, http.StatusCreated, user)
}
```

## Testing

```go
// Table-driven tests
func TestParseAmount(t *testing.T) {
    tests := []struct {
        name    string
        input   string
        want    int
        wantErr bool
    }{
        {"valid amount", "100.50", 10050, false},
        {"zero", "0", 0, false},
        {"invalid", "abc", 0, true},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got, err := ParseAmount(tt.input)
            if (err != nil) != tt.wantErr {
                t.Errorf("ParseAmount(%q) error = %v, wantErr %v", tt.input, err, tt.wantErr)
                return
            }
            if got != tt.want {
                t.Errorf("ParseAmount(%q) = %v, want %v", tt.input, got, tt.want)
            }
        })
    }
}
```

## Avoid

- `init()` functions (hidden side effects)
- Global mutable state
- Panic for expected errors (panic only for programmer bugs)
- Interface pollution (don't create interfaces until you need polymorphism)
- `any` / `interface{}` when concrete types work
- Premature abstraction (duplicate before abstracting)
