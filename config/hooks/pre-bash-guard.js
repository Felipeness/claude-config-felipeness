// Hook: PreToolUse (Bash)
// Unified guard: blocks dangerous commands + validates conventional commits
// Exit 0 = allow, Exit 2 = block

const { execSync } = require('child_process')

// --- Dangerous command patterns ---
const DANGEROUS_PATTERNS = [
  'rm -rf /',
  'rm -rf ~',
  'rm -rf .',
  'git push.*--force.*main',
  'git push.*--force.*master',
  'git push.*--force.*develop',
  'git reset --hard',
  'git clean -fd',
  'git checkout -- .',
  'git restore .',
  'git branch -D',
  'DROP TABLE',
  'DROP DATABASE',
  'TRUNCATE',
  'format c:',
  '> /dev/sda',
  'chmod.*777',
  'curl.*\\|.*bash',
  'curl.*\\|.*sh\\b',
  'wget.*\\|.*bash',
  'wget.*\\|.*sh\\b',
  'mkfs',
  'dd if=',
  'npm publish',
  'del /s /q',
  'rd /s /q',
  'rmdir /s /q',
  'reg delete',
  'schtasks /create',
  'wmic process call create',
  'certutil.*-urlcache',
  'git filter-branch',
  'git reflog expire',
]

const DANGEROUS_REGEXES = DANGEROUS_PATTERNS.map(p => new RegExp(p, 'i'))

// --- Commit validation ---
const VALID_TYPES = ['feat', 'fix', 'chore', 'refactor', 'docs', 'test', 'style', 'perf', 'ci', 'build', 'revert']
const TYPES_RE = VALID_TYPES.join('|')
// Accepts optional ! before colon for breaking changes: type(scope)!: or type!:
const COMMIT_RE = new RegExp(`^(${TYPES_RE})(\\([a-zA-Z0-9_./-]+\\))?!?: .+`)

let input = ''
process.stdin.on('data', chunk => input += chunk)
process.stdin.on('end', () => {
  try {
    const { tool_input } = JSON.parse(input)
    const command = tool_input?.command || ''
    guard(command)
  } catch {
    process.exit(0)
  }
})

function guard(command) {
  checkDangerous(command)
  validateCommit(command)
  process.exit(0)
}

// --- Dangerous command check (fast rejection) ---

function checkDangerous(command) {
  for (const re of DANGEROUS_REGEXES) {
    if (re.test(command)) {
      fail([
        `BLOCKED: Dangerous command detected: ${re.source}`,
        'Use a safer alternative or ask the user for explicit confirmation.',
      ])
    }
  }
}

// --- Commit message validation ---

function validateCommit(command) {
  // Only validate git commit commands (accepts git -C /path commit)
  if (!/git\s+(?:-C\s+\S+\s+)?commit/.test(command)) return

  // Ignore --amend without -m
  if (/--amend/.test(command) && !/-m\s/.test(command)) return

  const msg = extractMessage(command)
  if (!msg) return

  const firstLine = msg.split('\n')[0].trim()

  // Block "Claude Code" in commit messages (CLAUDE.md rule)
  if (/claude code/i.test(firstLine)) {
    fail([
      'Commit message contains "Claude Code".',
      'CLAUDE.md prohibits mentioning Claude Code in commit messages.',
      `Recebido: ${firstLine}`,
    ])
  }

  // Validate conventional commit format
  if (!COMMIT_RE.test(firstLine)) {
    fail([
      'Commit message fora do padrao conventional commits.',
      '',
      'Formato esperado: type(scope): descricao',
      'Breaking changes: type(scope)!: descricao',
      `Tipos validos: ${VALID_TYPES.join(', ')}`,
      '',
      'Exemplos:',
      '  feat(CC-1234): add gamification scoring',
      '  fix(CC-5678): handle null user in payment',
      '  chore: update dependencies',
      '  feat(CC-1234)!: change API response format',
      '',
      `Mensagem recebida: ${firstLine}`,
    ])
  }

  // Extract description (after type(scope)!?: )
  const descMatch = firstLine.match(new RegExp(`^(${TYPES_RE})(\\([^)]+\\))?!?: (.+)`))
  if (descMatch) {
    const desc = descMatch[3]

    // Description must start with lowercase
    if (/^[A-Z]/.test(desc)) {
      fail([
        'Descricao do commit deve comecar com letra minuscula.',
        `Recebido: ${firstLine}`,
        `Sugestao: ${firstLine.replace(/: ./, m => ': ' + m[2].toLowerCase())}`,
      ])
    }
  }

  // Max 72 chars
  if (firstLine.length > 72) {
    fail([
      `Primeira linha do commit muito longa (${firstLine.length} chars, max 72).`,
      `Recebido: ${firstLine}`,
    ])
  }

  // Check if branch has Jira ticket (uses -C from command if present)
  try {
    const repoDir = extractGitCDir(command)
    const gitCmd = repoDir
      ? `git -C "${repoDir}" rev-parse --abbrev-ref HEAD`
      : 'git rev-parse --abbrev-ref HEAD'
    const branch = execSync(gitCmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim()
    const ticketMatch = branch.match(/[A-Z]+-\d+/)

    if (ticketMatch && !firstLine.includes(ticketMatch[0])) {
      const ticket = ticketMatch[0]
      const suggestion = firstLine.replace(
        new RegExp(`^(${TYPES_RE})(\\([^)]*\\))?(!?:)`),
        `$1(${ticket})$3`
      )
      fail([
        `A branch '${branch}' referencia o ticket ${ticket}, mas o commit nao.`,
        `Adicione o ticket no scope: type(${ticket}): descricao`,
        '',
        `Recebido: ${firstLine}`,
        `Sugestao: ${suggestion}`,
      ])
    }
  } catch {
    // Not in a git repo, skip
  }
}

function extractMessage(command) {
  // Heredoc: <<'EOF' ... EOF
  const heredocMatch = command.match(/<<'?EOF'?\s*\n([\s\S]*?)\n\s*EOF/)
  if (heredocMatch) return heredocMatch[1].trim()

  // -m "..." or -m '...'
  const doubleQuoteMatch = command.match(/-m\s+"([^"]+)"/)
  if (doubleQuoteMatch) return doubleQuoteMatch[1]

  const singleQuoteMatch = command.match(/-m\s+'([^']+)'/)
  if (singleQuoteMatch) return singleQuoteMatch[1]

  // -m "$(cat <<'EOF' ... EOF )" (pattern used by Claude Code)
  const catHeredocMatch = command.match(/cat\s+<<'?EOF'?\s*\n([\s\S]*?)\n\s*EOF/)
  if (catHeredocMatch) return catHeredocMatch[1].trim()

  return null
}

function extractGitCDir(command) {
  const match = command.match(/git\s+-C\s+["']?([^\s"']+)["']?\s/)
  if (!match) return null
  // Convert MSYS2 path (/c/Users/...) to Windows (C:/Users/...)
  return match[1].replace(/^\/([a-zA-Z])\//, '$1:/')
}

function fail(lines) {
  process.stderr.write(lines.join('\n') + '\n')
  process.exit(2)
}
