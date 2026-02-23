---
description: Create and open a pull request with comprehensive summary and test plan
argument-hint: [pr title]
allowed-tools: Bash(git:*), Bash(gh:*)
---

# Open Pull Request

Create PR: $ARGUMENTS

## Process

### 1. Pre-flight
```bash
git status
git log --oneline main..HEAD
git diff main...HEAD --stat
```

### 2. Commit Changes
If there are uncommitted changes:
```bash
git add -A
git commit -m "<type>: <description>"
```

Commit types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`

### 3. Push Branch
```bash
git push -u origin HEAD
```

### 4. Create PR
```bash
gh pr create --title "<title>" --body "$(cat <<'EOF'
## Summary
- [Main change 1]
- [Main change 2]

## Test Plan
- [ ] [How to verify change 1]
- [ ] [How to verify change 2]

## Notes
[Any deployment or migration notes]
EOF
)"
```

## Output
Return the PR URL for review.
