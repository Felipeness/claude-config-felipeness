#!/bin/bash
# Hook: SessionEnd
# Limpa arquivos temporarios criados por agentes durante a sessao

HOME_DIR="$HOME"

# Patterns comuns de temp files de agentes
rm -f "$HOME_DIR"/temp*.json 2>/dev/null
rm -f "$HOME_DIR"/temp*.txt 2>/dev/null
rm -f "$HOME_DIR"/scratch*.md 2>/dev/null
rm -f "$HOME_DIR"/scratch*.txt 2>/dev/null
rm -f "$HOME_DIR"/*.tmp 2>/dev/null
rm -f /tmp/claude-scratch-* 2>/dev/null
rm -f /tmp/claude-work-* 2>/dev/null
rm -f /tmp/jira-comment-* 2>/dev/null

# Conta quantos arquivos foram removidos (pra log)
exit 0
