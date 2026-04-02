// Hook: PreToolUse (Bash)
// Valida branch names contra a convencao de naming do projeto
// Exit 0 = permite, Exit 2 = bloqueia

const VALID_TYPES = ['feat', 'fix', 'chore', 'refactor', 'docs', 'test', 'perf', 'ci']
const PROTECTED_BRANCHES = ['main', 'master', 'develop', 'staging', 'HEAD']
const BRANCH_RE = /^(feat|fix|chore|refactor|docs|test|perf|ci)\/([A-Z]+-\d+-)?[a-z0-9-]+$/

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
  const branchName = extractBranchName(command)
  if (!branchName) process.exit(0)

  // Protected branches don't follow the convention
  if (PROTECTED_BRANCHES.includes(branchName)) process.exit(0)

  if (BRANCH_RE.test(branchName)) process.exit(0)

  const suggestions = diagnose(branchName)

  fail([
    `Branch name '${branchName}' fora do padrao.`,
    '',
    'Formato esperado:',
    '  type/TICKET-short-description  (com Jira)',
    '  type/short-description         (sem Jira)',
    '',
    `Tipos validos: ${VALID_TYPES.join(', ')}`,
    '',
    'Exemplos:',
    '  feat/CC-1234-gamification-scoring',
    '  fix/null-user-payment',
    '  chore/update-dependencies',
    ...suggestions,
  ])
}

function extractBranchName(command) {
  // Strip git -C /path prefix
  const normalized = command.replace(/git\s+-C\s+["']?[^\s"']+["']?\s+/, 'git ')

  // git checkout -b branch-name [start-point]
  const checkoutMatch = normalized.match(/git\s+checkout\s+-b\s+["']?([^\s"']+)["']?/)
  if (checkoutMatch) return checkoutMatch[1]

  // git switch -c branch-name [start-point]
  // git switch --create branch-name [start-point]
  const switchMatch = normalized.match(/git\s+switch\s+(?:-c|--create)\s+["']?([^\s"']+)["']?/)
  if (switchMatch) return switchMatch[1]

  // git branch new-branch-name [start-point]
  // Skip: git branch -d, git branch -D, git branch -m, git branch -a, git branch -l, git branch -r, git branch --list, git branch --delete, git branch --set-upstream-to, etc.
  const branchMatch = normalized.match(/git\s+branch\s+(?!-[a-zA-Z]|--[a-z])["']?([^\s"']+)["']?/)
  if (branchMatch) return branchMatch[1]

  return null
}

function diagnose(branchName) {
  const lines = ['']

  // Check if type prefix is missing or invalid
  const slashIdx = branchName.indexOf('/')
  if (slashIdx === -1) {
    const guessedType = guessType(branchName)
    lines.push(`Sugestao: ${guessedType}/${branchName.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`)
    return lines
  }

  const type = branchName.slice(0, slashIdx)
  const rest = branchName.slice(slashIdx + 1)

  if (!VALID_TYPES.includes(type)) {
    const closest = findClosestType(type)
    lines.push(`Tipo '${type}' invalido. Voce quis dizer '${closest}'?`)
    lines.push(`Sugestao: ${closest}/${rest}`)
    return lines
  }

  // Type is valid but the rest doesn't match
  if (/[A-Z]/.test(rest) && !/^[A-Z]+-\d+-/.test(rest)) {
    lines.push('O nome apos o tipo deve ser lowercase (a-z, 0-9, hifens).')
    const fixed = rest.replace(/^([A-Z]+-\d+-)/, '$1').toLowerCase().replace(/[^a-z0-9-]/g, '-')
    lines.push(`Sugestao: ${type}/${fixed}`)
  } else if (rest.includes('_') || rest.includes(' ')) {
    const fixed = rest.toLowerCase().replace(/[_ ]+/g, '-').replace(/[^a-z0-9-]/g, '')
    lines.push('Use hifens ao inves de underscores ou espacos.')
    lines.push(`Sugestao: ${type}/${fixed}`)
  } else {
    const fixed = rest.toLowerCase().replace(/[^a-z0-9-]/g, '-')
    lines.push(`Sugestao: ${type}/${fixed}`)
  }

  return lines
}

function guessType(name) {
  const lower = name.toLowerCase()
  if (lower.includes('fix') || lower.includes('bug')) return 'fix'
  if (lower.includes('feat') || lower.includes('add') || lower.includes('new')) return 'feat'
  if (lower.includes('refactor')) return 'refactor'
  if (lower.includes('doc')) return 'docs'
  if (lower.includes('test')) return 'test'
  if (lower.includes('perf')) return 'perf'
  return 'feat'
}

function findClosestType(input) {
  const lower = input.toLowerCase()
  let best = VALID_TYPES[0]
  let bestScore = 0

  for (const type of VALID_TYPES) {
    let score = 0
    const minLen = Math.min(lower.length, type.length)
    for (let i = 0; i < minLen; i++) {
      if (lower[i] === type[i]) score++
      else break
    }
    if (score > bestScore) {
      bestScore = score
      best = type
    }
  }

  return best
}

function fail(lines) {
  process.stderr.write(lines.join('\n') + '\n')
  process.exit(2)
}
