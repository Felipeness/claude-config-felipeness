// Hook: PostToolUse (Bash)
// Validates PR title and body after `gh pr create`
// Checks: Jira link, defensive phrases, conventional commit title
// Advisory only (exit 0) — warns via additionalContext

const VALID_TYPES = ['feat', 'fix', 'chore', 'refactor', 'docs', 'test', 'style', 'perf', 'ci', 'build', 'revert']
const TYPES_RE = VALID_TYPES.join('|')
const TITLE_RE = new RegExp(`^(${TYPES_RE})(\\([a-zA-Z0-9_./-]+\\))?: [a-z]`)

const JIRA_LINK_RE = /Jira:\s*https:\/\/superlogica\.atlassian\.net\/browse\//
const JIRA_NA_RE = /Jira:\s*N\/A/

const DEFENSIVE_PHRASES = [
  'what is not included',
  'what was not changed',
  'why .+ was not',
  'o que não foi incluído',
  'o que nao foi incluido',
  'o que não foi alterado',
  'o que nao foi alterado',
]
const DEFENSIVE_RE = new RegExp(DEFENSIVE_PHRASES.join('|'), 'i')

let input = ''
process.stdin.on('data', chunk => input += chunk)
process.stdin.on('end', () => {
  try {
    const { tool_input } = JSON.parse(input)
    const command = tool_input?.command || ''

    if (!/gh\s+pr\s+create/.test(command)) process.exit(0)

    const warnings = []

    const body = extractBody(command)
    const title = extractTitle(command)

    // Rule 1: Jira link
    if (body) {
      if (!JIRA_LINK_RE.test(body) && !JIRA_NA_RE.test(body)) {
        warnings.push(
          '[PR-BODY] Missing Jira reference in PR body.',
          'Expected: `Jira: https://superlogica.atlassian.net/browse/CC-XXXX` or `Jira: N/A (chore/infra)`'
        )
      }
    } else {
      warnings.push(
        '[PR-BODY] Could not extract PR body from command. Ensure it contains a Jira reference.',
        'Expected: `Jira: https://superlogica.atlassian.net/browse/CC-XXXX` or `Jira: N/A (chore/infra)`'
      )
    }

    // Rule 2: Defensive phrases
    if (body) {
      const match = body.match(DEFENSIVE_RE)
      if (match) {
        warnings.push(
          `[PR-BODY] Defensive justification detected: "${match[0]}"`,
          'PR descriptions should focus on what WAS done, not what was NOT done.',
          'Remove defensive sections and keep the description positive and concise.'
        )
      }
    }

    // Rule 3: Conventional commit title
    if (title) {
      if (!TITLE_RE.test(title)) {
        warnings.push(
          `[PR-TITLE] Title does not follow conventional commit format: "${title}"`,
          `Expected: type(scope): description (lowercase)`,
          `Valid types: ${VALID_TYPES.join(', ')}`
        )
      }
    }

    if (warnings.length === 0) process.exit(0)

    const result = {
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: warnings.join('\n')
      }
    }
    process.stdout.write(JSON.stringify(result))
  } catch {
    // ignora erros
  }
  process.exit(0)
})

function extractBody(command) {
  // --body "$(cat <<'EOF' ... EOF )"  (pattern from CLAUDE.md)
  const catHeredocMatch = command.match(/--body\s+"?\$\(cat\s+<<'?EOF'?\s*\n([\s\S]*?)\n\s*EOF/)
  if (catHeredocMatch) return catHeredocMatch[1].trim()

  // --body "..." (double quotes)
  const doubleQuoteMatch = command.match(/--body\s+"((?:[^"\\]|\\.)*)"/s)
  if (doubleQuoteMatch) return doubleQuoteMatch[1]

  // --body '...' (single quotes)
  const singleQuoteMatch = command.match(/--body\s+'((?:[^'\\]|\\.)*)'/s)
  if (singleQuoteMatch) return singleQuoteMatch[1]

  return null
}

function extractTitle(command) {
  // --title "..."
  const doubleQuoteMatch = command.match(/--title\s+"([^"]+)"/)
  if (doubleQuoteMatch) return doubleQuoteMatch[1]

  // --title '...'
  const singleQuoteMatch = command.match(/--title\s+'([^']+)'/)
  if (singleQuoteMatch) return singleQuoteMatch[1]

  return null
}
