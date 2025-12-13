---
name: planning
description: Project planning and architecture decision-making workflow. Use when starting new projects, designing systems, choosing technologies, or making architectural decisions. Emphasizes simplicity, type-safety, and avoiding over-engineering while ensuring observability and maintainability.
---

# Planning Guidelines

Workflow for project planning, architecture decisions, and technical design.

## When to Use
- Starting new projects
- Choosing technologies/frameworks
- Designing system architecture
- Planning refactoring efforts
- Making technical decisions
- Evaluating trade-offs

## Planning Process

### 1. Understand Requirements
Ask:
- What problem are we solving?
- Who are the users?
- What are the constraints? (time, performance, scale)
- What are the non-negotiables?

### 2. Define Success Criteria
Establish:
- Measurable outcomes
- Performance targets
- Quality standards

### 3. Choose Technologies

#### Decision Framework
Evaluate based on:
1. **Type-safety**: Does it support e2e type-safety?
2. **Developer experience**: How easy to use and maintain?
3. **Ecosystem**: Libraries, tools, community support?
4. **Performance**: Meets requirements?
5. **Team knowledge**: Learning curve?

#### Prefer Technologies That Support
- e2e type-safety
- Built-in observability/monitoring
- Active maintenance
- Strong TypeScript support
- Testing capabilities

### 4. Design Architecture

#### Core Principles
- **KISS** (Keep It Simple, Stupid)
- **YAGNI** (You Aren't Gonna Need It)
- Avoid premature optimization
- No over-engineering

#### Architecture Checklist
- [ ] e2e type-safety (API -> Database)
- [ ] Error monitoring/observability
- [ ] Automated testing strategy
- [ ] Accessibility (a11y, WCAG 2.0)
- [ ] Security (OWASP best practices)
- [ ] Scalability path (if needed)

#### Common Patterns

**Frontend (React)**
- React Query for data fetching
- Suspense boundaries for loading states
- Error boundaries with retry
- TypeScript strict mode
- Component library (shadcn/ui, etc.)

**Backend (Node.js/TypeScript)**
- Query builder (Prisma, Drizzle, Kysely)
- Type-safe API layer (tRPC, GraphQL)
- Error monitoring (Sentry, LogRocket)
- Validation library (Zod, Yup)

**Database**
- Choose based on data model:
  - Relational: PostgreSQL (with Prisma/Drizzle)
  - Document: MongoDB (with type-safe client)
  - Key-value: Redis
- Prioritize type-safe query builders

### 5. Plan Structure

#### File Organization
```
src/
├── features/          # Feature-based organization
│   ├── auth/
│   ├── payments/
│   └── users/
├── lib/              # Shared utilities
├── types/            # Shared types
└── config/           # Configuration
```

Principles:
- Co-locate related files
- Feature-based over layer-based
- No premature abstraction
- Single-file folders should be files

### 6. Plan Testing Strategy

#### Coverage Goals
- Critical paths: 100%
- Business logic: 80%+
- UI components: Key interactions

#### Test Types
- **Unit**: Pure functions, utilities
- **Integration**: API endpoints, database queries
- **E2E**: Critical user flows

### 7. Plan Observability

#### Monitoring Requirements
- [ ] Error tracking (Sentry, Rollbar)
- [ ] Performance monitoring (Web Vitals)
- [ ] Logging strategy
- [ ] Alerting thresholds

### 8. Security Planning

#### OWASP Checklist
- [ ] Input validation
- [ ] SQL injection prevention (query builders)
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Authentication/authorization
- [ ] Environment variables handling

### 9. Accessibility Planning

#### WCAG 2.0 Guidelines
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] Color contrast
- [ ] Focus indicators
- [ ] ARIA labels
- [ ] Semantic HTML

## Decision Making

### Avoid Over-Engineering

#### Signs of Over-Engineering
- Abstractions used once
- Frameworks for simple tasks
- Premature optimization
- Complex patterns for simple problems
- "Future-proofing" without requirements

#### Keep It Simple
- Start minimal, add as needed
- One abstraction layer at a time
- Refactor when patterns emerge (2-3 uses)
- Concrete before abstract

## Review Before Starting

- [ ] Requirements clearly defined
- [ ] Success criteria measurable
- [ ] Technology choices justified
- [ ] Architecture supports requirements
- [ ] Type-safety end-to-end
- [ ] Testing strategy defined
- [ ] Observability planned
- [ ] Security considered
- [ ] Accessibility addressed
- [ ] No over-engineering
- [ ] KISS and YAGNI applied

---

**Criado por FelipeNess** | **12/12/2025**
**GitHub:** [github.com/Felipeness](https://github.com/Felipeness)
