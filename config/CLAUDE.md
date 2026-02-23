## Git Workflow
- Do not include "Claude Code" in commit messages
- Use conventional commits (be brief and descriptive)
- Commit immediately upon task completion

## Workflow
- Start non-trivial tasks in plan mode
- Break subtasks small enough to complete within 50% context window
- Use `/compact` proactively before hitting 50% context usage
- Use git worktrees for parallel development branches when beneficial
- Vanilla Claude Code with well-defined tasks outperforms complex fragmented workflows
- MCP strategy: Research (Context7/DeepWiki) → Debug (Playwright/Chrome) → Document (Excalidraw)

## Important Concepts
Focus on these principles in all code:
- e2e type-safety
- error monitoring/observability
- automated tests
- readability/maintainability

All detailed coding guidelines are in the skills:
- Use `coding-guidelines` skill for programming standards
- Use `typescript` skill for TypeScript/JavaScript standards
- Use `react` skill for React/Next.js best practices
- Use `go` skill for Go/Golang standards
- Use `software-engineering` skill for core principles
- Use `planning` skill for architecture decisions
- Use `api-design` skill for REST/webhook API patterns
- Use `observability` skill for logging, tracing, monitoring
- Use `debugging` skill for structured bug investigation
- Use `refactoring` skill for safe code improvements
- Use `review-changes` skill for code reviews
- Use `reviewing-code` skill for PR/commit reviews
- Use `writing` skill for documentation and commit messages
- Use `copywriting` skill for marketing content