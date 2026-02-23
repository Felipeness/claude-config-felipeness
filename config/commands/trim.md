---
description: Reduce current PR description by 70% while preserving essential information
---

# Trim PR Description

Reduce the current PR description by 70%.

## Rules

### Keep
- Core summary (what changed)
- Critical test steps
- Breaking changes
- Required actions

### Remove
- Redundant explanations
- Obvious details
- Verbose formatting
- Repeated information

### Technique
1. Read current description
2. Identify essential information
3. Rewrite concisely
4. Target: 30% of original length

## Format

Before:
```
## Summary
This PR implements a new user authentication system that allows users
to log in using their email address and password. The system validates
credentials against the database and creates a session token that is
stored in a secure HTTP-only cookie.

## Changes
- Added new login endpoint at /api/auth/login
- Created user validation service
- Implemented session management
- Added password hashing with bcrypt
...
```

After:
```
## Summary
Email/password auth with secure session cookies.

## Changes
- `/api/auth/login` endpoint
- Session management with HTTP-only cookies
- bcrypt password hashing
```

## Output
Provide the trimmed PR description ready to replace the original.
