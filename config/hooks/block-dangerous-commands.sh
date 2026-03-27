#!/bin/bash
# PreToolUse hook: block dangerous bash commands
# Prevents accidental data loss during fast-paced development

# Read tool input from stdin
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | node -e "
const data = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
console.log(data.tool_input?.command || '');
")

# Patterns to block
DANGEROUS_PATTERNS=(
  "rm -rf /"
  "rm -rf ~"
  "rm -rf \*"
  "git push.*--force.*main"
  "git push.*--force.*master"
  "git reset --hard"
  "git clean -fd"
  "DROP TABLE"
  "DROP DATABASE"
  "TRUNCATE"
  "format c:"
  "> /dev/sda"
)

for pattern in "${DANGEROUS_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qi "$pattern"; then
    echo "BLOCKED: Dangerous command detected: $pattern" >&2
    echo "Use a safer alternative or ask the user for explicit confirmation." >&2
    exit 2
  fi
done

exit 0
