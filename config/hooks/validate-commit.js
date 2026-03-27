// Hook: PreToolUse (Bash)
// Valida commit messages contra conventional commits + Jira ticket
// Exit 0 = permite, Exit 2 = bloqueia

const { execSync } = require('child_process')

const VALID_TYPES = ['feat', 'fix', 'chore', 'refactor', 'docs', 'test', 'style', 'perf', 'ci', 'build', 'revert']
const TYPES_RE = VALID_TYPES.join('|')
const COMMIT_RE = new RegExp(`^(${TYPES_RE})(\\([a-zA-Z0-9_./-]+\\))?: .+`)

let input = ''
process.stdin.on('data', chunk => input += chunk)
process.stdin.on('end', () => {
  try {
    const { tool_input } = JSON.parse(input)
    const command = tool_input?.command || ''
    validate(command)
  } catch {
    process.exit(0)
  }
})

function validate(command) {
  // So valida git commit (aceita git -C /path commit)
  if (!/git\s+(?:-C\s+\S+\s+)?commit/.test(command)) process.exit(0)

  // Ignora --amend sem -m
  if (/--amend/.test(command) && !/-m\s/.test(command)) process.exit(0)

  // Extrai mensagem do commit
  const msg = extractMessage(command)
  if (!msg) process.exit(0)

  const firstLine = msg.split('\n')[0].trim()

  // Valida formato conventional commit
  if (!COMMIT_RE.test(firstLine)) {
    fail([
      'Commit message fora do padrao conventional commits.',
      '',
      'Formato esperado: type(scope): descricao',
      `Tipos validos: ${VALID_TYPES.join(', ')}`,
      '',
      'Exemplos:',
      '  feat(CC-1234): add gamification scoring',
      '  fix(CC-5678): handle null user in payment',
      '  chore: update dependencies',
      '',
      `Mensagem recebida: ${firstLine}`,
    ])
  }

  // Extrai descricao (depois do type(scope): )
  const descMatch = firstLine.match(new RegExp(`^(${TYPES_RE})(\\([^)]+\\))?: (.+)`))
  if (descMatch) {
    const desc = descMatch[3]

    // Descricao deve comecar com minuscula
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

  // Checa se branch tem ticket Jira (usa -C do comando se presente, para pegar a branch do repo correto)
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
        new RegExp(`^(${TYPES_RE})(\\([^)]*\\))?(: )`),
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
    // Nao esta em um repo git, ignora
  }

  process.exit(0)
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

  // -m "$(cat <<'EOF' ... EOF )"  (pattern usado pelo Claude Code)
  const catHeredocMatch = command.match(/cat\s+<<'?EOF'?\s*\n([\s\S]*?)\n\s*EOF/)
  if (catHeredocMatch) return catHeredocMatch[1].trim()

  return null
}

function extractGitCDir(command) {
  // git -C /path/to/repo commit ...
  const match = command.match(/git\s+-C\s+["']?([^\s"']+)["']?\s/)
  if (!match) return null
  // Converte MSYS2 path (/c/Users/...) para Windows (C:/Users/...)
  return match[1].replace(/^\/([a-zA-Z])\//, '$1:/')
}

function fail(lines) {
  process.stderr.write(lines.join('\n') + '\n')
  process.exit(2)
}
