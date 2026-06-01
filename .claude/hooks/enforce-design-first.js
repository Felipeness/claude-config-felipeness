#!/usr/bin/env node

/**
 * Design-First Enforcement Hook — PreToolUse on Edit|Write
 *
 * Blocks code file edits in governed projects (docs/superpowers/ exists)
 * when no implementation plan exists yet.
 *
 * Exit 0 = allow
 * Exit 2 = block with feedback
 */

const fs = require('fs')
const path = require('path')

const CODE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.go', '.py', '.rs', '.java', '.kt', '.swift',
])

const EXEMPT_PATTERNS = [
  /[/\\]docs[/\\]/,
  /[/\\]scripts[/\\]/,
  /[/\\]\.claude[/\\]/,
  /[/\\]node_modules[/\\]/,
  /[/\\]\.git[/\\]/,
  /[/\\]__mocks__[/\\]/,
]

const CONFIG_PATTERNS = [
  /\.config\.(ts|js|mjs|cjs)$/,
  /\.setup\.(ts|js)$/,
  /jest\./,
  /vitest\./,
  /eslint/,
  /prettier/,
  /tailwind/,
  /next\.config/,
  /tsconfig/,
  /webpack/,
  /vite\.config/,
  /rollup/,
  /babel/,
]

const TEST_PATTERNS = [
  /\.test\.(ts|tsx|js|jsx)$/,
  /\.spec\.(ts|tsx|js|jsx)$/,
  /_test\.go$/,
  /test_.*\.py$/,
  /.*_test\.py$/,
]

let raw = ''
process.stdin.on('data', (chunk) => (raw += chunk))
process.stdin.on('end', () => {
  let input
  try {
    input = JSON.parse(raw)
  } catch {
    process.exit(0)
  }

  const filePath = (input.tool_input?.file_path || '').replace(/\\/g, '/')
  const cwd = (input.cwd || process.cwd()).replace(/\\/g, '/')

  // 1. Not a code file → allow
  const ext = path.extname(filePath).toLowerCase()
  if (!CODE_EXTENSIONS.has(ext)) process.exit(0)

  // 2. Not a governed project → allow
  const superDir = path.join(cwd, 'docs', 'superpowers').replace(/\\/g, '/')
  if (!fs.existsSync(superDir)) process.exit(0)

  // 3. Exempt paths → allow
  if (EXEMPT_PATTERNS.some((re) => re.test(filePath))) process.exit(0)

  // 4. Config files → allow
  const basename = path.basename(filePath)
  if (CONFIG_PATTERNS.some((re) => re.test(basename))) process.exit(0)

  // 5. Test files that already exist (editing, not creating) → allow
  if (TEST_PATTERNS.some((re) => re.test(basename))) {
    if (fs.existsSync(filePath.replace(/\//g, path.sep))) process.exit(0)
    // New test file without plan — still allow (TDD writes tests first)
    process.exit(0)
  }

  // 6. Ralph loop active → allow
  const ralphState = path.join(cwd, '.claude', 'ralph-state')
  const ralphLegacy = path.join(cwd, '.claude', 'ralph-loop.local.md')
  if (fs.existsSync(ralphLegacy)) process.exit(0)
  if (fs.existsSync(ralphState)) {
    try {
      const dirs = fs.readdirSync(ralphState)
      for (const d of dirs) {
        const pidFile = path.join(ralphState, d, 'runner.pid')
        if (fs.existsSync(pidFile)) {
          const pid = parseInt(fs.readFileSync(pidFile, 'utf8').trim())
          if (pid && isProcessRunning(pid)) process.exit(0)
        }
      }
    } catch { /* fall through */ }
  }

  // 7. Plan exists → allow
  const plansDir = path.join(superDir, 'plans')
  if (fs.existsSync(plansDir)) {
    try {
      const plans = fs.readdirSync(plansDir).filter((f) => f.endsWith('.md'))
      if (plans.length > 0) process.exit(0)
    } catch { /* fall through */ }
  }

  // 8. No plan, governed project, code file → BLOCK
  process.stdout.write(
    '[Design-First] BLOCKED: este projeto usa pipeline de design (docs/superpowers/ existe) mas nenhum plano foi encontrado.\n' +
    '\n' +
    'Antes de escrever codigo, execute o pipeline:\n' +
    '  1. brainstorming → definir spec\n' +
    '  2. writing-plans → criar plano de implementacao\n' +
    '\n' +
    'Se e um fix trivial, use um Ralph loop (ralph-debug, ralph-test) que gerencia o proprio contexto.\n' +
    'Se o projeto nao deveria ser governado, remova docs/superpowers/.'
  )
  process.exit(2)
})

function isProcessRunning(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}
