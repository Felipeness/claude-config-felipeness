#!/bin/bash
# PostCompact hook: re-inject critical context after compaction
# This prevents Claude from losing important project-specific knowledge

echo "CONTEXT RE-INJECTION AFTER COMPACTION:"
echo "- Always check CLAUDE.md for project guidelines before making changes"
echo "- Use /context to monitor context usage"
echo "- Use subagents for heavy exploration to preserve main context"
echo "- Run existing tests before adding new ones"
echo "- Check git status before committing"
exit 0
