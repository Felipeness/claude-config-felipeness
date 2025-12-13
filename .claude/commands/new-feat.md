---
description: Plan and implement a new feature following CLAUDE.md guidelines with focus on clarity, observability, security, accessibility, and performance
argument-hint: [feature description]
---

# New Feature Development

Plan and implement a new feature: $ARGUMENTS

## Approach:
1. **Research & Analysis**
   - Analyze existing codebase architecture and patterns
   - Identify dependencies and integration points
   - Review similar implementations for best practices

2. **Planning & Design**
   - Break down the feature into manageable tasks
   - Design clear, descriptive interfaces (avoid ambiguous names like `data`, `info`, `stuff`)
   - Plan for e2e type-safety from start to finish
   - Consider accessibility requirements (WCAG 2.0 guidelines)

3. **Implementation Guidelines**
   - **Clarity**: Use descriptive names that say what they mean (`userPaymentDeadline` > `dataList`)
   - **TypeScript/JavaScript**: Never use `any`, prefer named exports, use early returns
   - **React**: Keep components pure, use React Query for data fetching, prefer `<Suspense>` and `useSuspenseQuery`
   - **Naming**: Use camelCase for functions, kebab-case for files, SNAKE_CAPS for constants

4. **Core Implementation Focus**
   - **E2E Type Safety**: Let compiler infer types, ensure full type coverage
   - **Observability**: Add monitoring, error handling, and profiling using HighOrderFunctions
   - **Security**: Follow OWASP best practices, use query builders (avoid raw SQL)
   - **Accessibility**: Implement a11y features, WCAG 2.0 compliance
   - **Performance**: Avoid premature optimization, focus on efficient algorithms

5. **Testing Strategy**
   - Test behavior, never implementation
   - Write tests for each bug fixed
   - Use 3rd person verbs (not "should")
   - Abuse describe clauses for organization

6. **Code Quality**
   - Avoid comments 98% of the time - convert to functions/variables instead
   - Use async/await over Promise().then()
   - Prefix unused vars with underscore
   - Prefer string literals over concatenation

7. **Final Checks**
   - Run linting and type checking
   - Verify no breaking changes
   - Ensure error boundaries with retry buttons (React)
   - Validate accessibility compliance

Focus on clear, observable, secure, accessible, and performant code that follows established patterns.