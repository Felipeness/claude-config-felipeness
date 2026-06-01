#!/bin/bash
# Hook: SessionEnd
# Limpa arquivos temporarios criados por agentes durante a sessao

HOME_DIR="$HOME"
CLAUDE_DIR="$HOME/.claude"

# Patterns comuns de temp files de agentes — varre $HOME e $HOME/.claude
for dir in "$HOME_DIR" "$CLAUDE_DIR"; do
  rm -f "$dir"/temp*.json 2>/dev/null
  rm -f "$dir"/temp*.txt 2>/dev/null
  rm -f "$dir"/temp_*.* 2>/dev/null
  rm -f "$dir"/scratch*.md 2>/dev/null
  rm -f "$dir"/scratch*.txt 2>/dev/null
  rm -f "$dir"/*.tmp 2>/dev/null
done
rm -f /tmp/claude-scratch-* 2>/dev/null
rm -f /tmp/claude-work-* 2>/dev/null
rm -f /tmp/jira-comment-* 2>/dev/null

# Conta quantos arquivos foram removidos (pra log)
exit 0
