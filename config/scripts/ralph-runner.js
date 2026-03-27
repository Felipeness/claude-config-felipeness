#!/usr/bin/env node

// Ralph Runner v2 — External Loop Engine with Phase Orchestration
// Runs `claude -p` in a loop with clean context per iteration.
// Supports multi-phase execution (implement → test → perf → docs → PR).
// State persists via files in .claude/ralph-state/<task-id>/

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// --- CLI Argument Parsing ---

const args = process.argv.slice(2)
const config = parseArgs(args)

if (config.help) {
  printHelp()
  process.exit(0)
}

validateConfig(config)

// --- Main ---

async function main() {
  const stateDir = ensureStateDir(config.cwd, config.taskId)

  writeConfig(stateDir, config)
  writePid(stateDir)

  log(stateDir, `Ralph Runner started: ${config.taskType} ${config.taskId}`)
  log(stateDir, `CWD: ${config.cwd}`)

  // Check if this task type uses phases
  const phases = readPhases(stateDir)

  if (phases.length > 0) {
    await runWithPhases(stateDir, phases)
  } else {
    await runSimpleLoop(stateDir)
  }

  cleanupPid(stateDir)
  log(stateDir, `\nRalph Runner finished.`)
}

main().catch(err => {
  console.error('Ralph Runner fatal error:', err.message)
  process.exit(1)
})

// --- Phase Orchestration ---

async function runWithPhases(stateDir, phases) {
  let totalIterations = 0

  for (const phase of phases) {
    if (phase.status === 'completed') {
      log(stateDir, `Phase "${phase.name}" already completed. Skipping.`)
      continue
    }
    if (phase.status === 'skipped') {
      log(stateDir, `Phase "${phase.name}" skipped (condition not met).`)
      continue
    }

    // Check skip condition
    if (phase.skipIf) {
      const shouldSkip = evaluateSkipCondition(phase.skipIf, stateDir)
      if (shouldSkip) {
        log(stateDir, `Phase "${phase.name}" skipped: ${phase.skipIf}`)
        updatePhaseStatus(stateDir, phase.name, 'skipped')
        continue
      }
    }

    log(stateDir, `\n${'#'.repeat(60)}`)
    log(stateDir, `PHASE: ${phase.name} (max ${phase.maxIterations} iterations)`)
    log(stateDir, `${'#'.repeat(60)}\n`)

    updatePhaseStatus(stateDir, phase.name, 'in_progress')

    // Write phase-specific prompt
    const phasePromptPath = path.join(stateDir, `prompt-${phase.name}.md`)
    if (!fs.existsSync(phasePromptPath)) {
      log(stateDir, `Warning: no prompt file for phase "${phase.name}" at ${phasePromptPath}`)
      updatePhaseStatus(stateDir, phase.name, 'skipped')
      continue
    }

    let iteration = 1
    let phaseDone = false

    while (!phaseDone) {
      if (phase.maxIterations > 0 && iteration > phase.maxIterations) {
        log(stateDir, `Phase "${phase.name}" max iterations reached (${phase.maxIterations}).`)
        break
      }

      totalIterations++
      compactJournalIfNeeded(stateDir, 5)
      writeIteration(stateDir, totalIterations)

      log(stateDir, `\n${'='.repeat(60)}`)
      log(stateDir, `PHASE: ${phase.name} | Iteration ${iteration}/${phase.maxIterations} (global: ${totalIterations})`)
      log(stateDir, `${'='.repeat(60)}\n`)

      const prompt = buildPhasePrompt(stateDir, config, phase, iteration, totalIterations)
      const output = runClaude(prompt, config.cwd, stateDir, totalIterations)

      const promiseRegex = new RegExp(`<promise>\\s*${escapeRegex(phase.completionPromise || 'PHASE_DONE')}\\s*</promise>`, 's')
      if (promiseRegex.test(output)) {
        phaseDone = true
        log(stateDir, `Phase "${phase.name}" completed in ${iteration} iterations!`)
        updatePhaseStatus(stateDir, phase.name, 'completed')
        notify(`Ralph Phase "${phase.name}" DONE (${config.taskId})`)
      } else {
        log(stateDir, `Phase "${phase.name}" iteration ${iteration} complete. Continuing...`)
      }

      iteration++
    }

    if (!phaseDone) {
      log(stateDir, `Phase "${phase.name}" did not complete within max iterations. Stopping pipeline.`)
      notify(`Ralph Loop ${config.taskId}: phase "${phase.name}" max iterations reached. Pipeline paused.`)
      break
    }
  }

  // Check if all phases completed
  const finalPhases = readPhases(stateDir)
  const allDone = finalPhases.every(p => p.status === 'completed' || p.status === 'skipped')
  if (allDone) {
    log(stateDir, `\nAll phases completed! Total iterations: ${totalIterations}`)
    notify(`Ralph Loop DONE: ${config.taskType}:${config.taskId} — all phases completed (${totalIterations} iterations)`)
  }
}

// --- Simple Loop (non-phased tasks) ---

async function runSimpleLoop(stateDir) {
  log(stateDir, `Max iterations: ${config.maxIterations || 'unlimited'}`)

  let iteration = readIteration(stateDir)
  let done = false

  while (!done) {
    if (config.maxIterations > 0 && iteration > config.maxIterations) {
      log(stateDir, `Max iterations reached (${config.maxIterations}). Stopping.`)
      notify(`Ralph Loop ${config.taskType}:${config.taskId} — max iterations reached (${config.maxIterations})`)
      break
    }

    compactJournalIfNeeded(stateDir, 5)
    writeIteration(stateDir, iteration)

    log(stateDir, `\n${'='.repeat(60)}`)
    log(stateDir, `ITERATION ${iteration}${config.maxIterations ? '/' + config.maxIterations : ''}`)
    log(stateDir, `${'='.repeat(60)}\n`)

    const prompt = buildPrompt(stateDir, config, iteration)
    const output = runClaude(prompt, config.cwd, stateDir, iteration)

    const promiseRegex = new RegExp(`<promise>\\s*${escapeRegex(config.completionPromise)}\\s*</promise>`, 's')
    if (promiseRegex.test(output)) {
      done = true
      log(stateDir, `\nCompletion promise detected! Task done in ${iteration} iterations.`)
      notify(`Ralph Loop DONE: ${config.taskType}:${config.taskId} completed in ${iteration} iterations`)
    } else {
      log(stateDir, `Iteration ${iteration} complete. Promise not found. Continuing...`)
    }

    iteration++
  }

  log(stateDir, `\nSimple loop finished. Total iterations: ${iteration - 1}`)
}

// --- Phase State Management ---

function readPhases(stateDir) {
  const phasesPath = path.join(stateDir, 'phases.json')
  if (!fs.existsSync(phasesPath)) return []
  try {
    return JSON.parse(fs.readFileSync(phasesPath, 'utf8'))
  } catch {
    return []
  }
}

function updatePhaseStatus(stateDir, phaseName, status) {
  const phasesPath = path.join(stateDir, 'phases.json')
  const phases = readPhases(stateDir)
  const phase = phases.find(p => p.name === phaseName)
  if (phase) {
    phase.status = status
    phase.updatedAt = new Date().toISOString()
    fs.writeFileSync(phasesPath, JSON.stringify(phases, null, 2))
  }
}

function evaluateSkipCondition(condition, stateDir) {
  // Simple condition evaluation based on state files
  // Supports: "no_perf_target" — skip if no perf target in progress.md
  //           "no_doc_gaps" — skip if no doc items in progress.md
  const progressPath = path.join(stateDir, 'progress.md')
  if (!fs.existsSync(progressPath)) return false
  const progress = fs.readFileSync(progressPath, 'utf8')

  switch (condition) {
    case 'no_perf_target':
      return !progress.includes('## Performance Target')
    case 'no_doc_gaps':
      return !progress.includes('## Documentation')
    case 'no_test_gaps':
      return !progress.includes('## Test Coverage')
    default:
      return false
  }
}

// --- Prompt Builders ---

function buildPhasePrompt(stateDir, config, phase, phaseIter, globalIter) {
  const parts = []

  parts.push(`[Ralph Loop — ${config.taskType}: ${config.taskId} | Phase: ${phase.name} | Iteration ${phaseIter}/${phase.maxIterations}]`)
  parts.push('')
  parts.push('You are in an AUTONOMOUS LOOP with PHASES. Each iteration runs in a CLEAN session — you have NO memory of previous iterations. Everything you need is in the state files below.')
  parts.push('')

  // Show phase pipeline status
  const allPhases = readPhases(stateDir)
  parts.push('## Pipeline Status')
  for (const p of allPhases) {
    const marker = p.name === phase.name ? '→' : ' '
    const status = p.status === 'completed' ? '✅' : p.status === 'skipped' ? '⏭️' : p.status === 'in_progress' ? '🔄' : '⏳'
    parts.push(`${marker} ${status} ${p.name}${p.name === phase.name ? ' (CURRENT)' : ''}`)
  }
  parts.push('')

  // Inject state files
  const stateFiles = ['progress.md', 'journal.md', 'plan.md', 'findings.md']
  for (const file of stateFiles) {
    const filePath = path.join(stateDir, file)
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8').trim()
      if (content) {
        parts.push(`## State: ${file}`)
        parts.push('```markdown')
        parts.push(content)
        parts.push('```')
        parts.push('')
      }
    }
  }

  // Phase-specific prompt
  const phasePromptPath = path.join(stateDir, `prompt-${phase.name}.md`)
  if (fs.existsSync(phasePromptPath)) {
    parts.push('## Phase Instructions')
    parts.push(fs.readFileSync(phasePromptPath, 'utf8').trim())
    parts.push('')
  }

  // Phase completion rules
  parts.push('## Rules for this phase iteration')
  parts.push(`1. Read ALL state files above CAREFULLY before doing anything`)
  parts.push(`2. You are in phase "${phase.name}" — focus ONLY on this phase's work`)
  parts.push(`3. Work on 1 item per iteration`)
  parts.push(`4. After completing work:`)
  parts.push(`   a. Update progress.md — mark completed items with [x]`)
  parts.push(`   b. Update journal.md — add this iteration's entry (adaptive: brief if success, detailed if failure)`)
  parts.push(`   c. Commit code changes with conventional commits`)
  parts.push(`5. When this phase's criteria are ALL met:`)
  parts.push(`   - Output: <promise>${phase.completionPromise || 'PHASE_DONE'}</promise>`)
  parts.push(`6. NEVER output the promise unless this phase is genuinely complete`)
  parts.push(`7. If stuck 2+ iterations on same item (check journal), change approach`)
  parts.push('')

  // State file paths
  parts.push('## State file paths (UPDATE these files directly)')
  parts.push(`- Progress: ${path.join(stateDir, 'progress.md').replace(/\\/g, '/')}`)
  parts.push(`- Journal: ${path.join(stateDir, 'journal.md').replace(/\\/g, '/')}`)
  const extraFiles = ['plan.md', 'findings.md']
  for (const f of extraFiles) {
    if (fs.existsSync(path.join(stateDir, f))) {
      parts.push(`- ${f}: ${path.join(stateDir, f).replace(/\\/g, '/')}`)
    }
  }

  return parts.join('\n')
}

function buildPrompt(stateDir, config, iteration) {
  const parts = []

  parts.push(`[Ralph Loop — ${config.taskType}: ${config.taskId} | Iteration ${iteration}${config.maxIterations ? '/' + config.maxIterations : ''}]`)
  parts.push('')
  parts.push('You are in an AUTONOMOUS LOOP. Each iteration runs in a CLEAN session — you have NO memory of previous iterations. Everything you need is in the state files below.')
  parts.push('')

  const stateFiles = ['progress.md', 'journal.md', 'plan.md', 'findings.md']
  for (const file of stateFiles) {
    const filePath = path.join(stateDir, file)
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8').trim()
      if (content) {
        parts.push(`## State: ${file}`)
        parts.push('```markdown')
        parts.push(content)
        parts.push('```')
        parts.push('')
      }
    }
  }

  const promptPath = path.join(stateDir, 'prompt.md')
  if (fs.existsSync(promptPath)) {
    parts.push('## Task Instructions')
    parts.push(fs.readFileSync(promptPath, 'utf8').trim())
    parts.push('')
  }

  parts.push('## Rules for this iteration')
  parts.push(`1. Read the state files above CAREFULLY before doing anything`)
  parts.push(`2. Identify the NEXT pending item from progress.md`)
  parts.push(`3. Work on ONLY that item (1 item per iteration)`)
  parts.push(`4. After completing work:`)
  parts.push(`   a. Update progress.md — mark completed items with [x]`)
  parts.push(`   b. Update journal.md — add this iteration's entry`)
  parts.push(`      - If SUCCESS on first try: 2-3 lines (criterion, result, commit)`)
  parts.push(`      - If FAILED then fixed: full detail (what failed, why, how fixed, lesson learned)`)
  parts.push(`   c. Commit your code changes with conventional commits`)
  parts.push(`5. If ALL items in progress.md are [x] AND tests pass:`)
  parts.push(`   - Output: <promise>${config.completionPromise}</promise>`)
  parts.push(`6. NEVER output <promise>${config.completionPromise}</promise> unless genuinely done`)
  parts.push(`7. If stuck on same item for 2+ iterations (check journal.md), change approach completely`)
  parts.push('')

  parts.push('## State file paths (UPDATE these files directly)')
  parts.push(`- Progress: ${path.join(stateDir, 'progress.md').replace(/\\/g, '/')}`)
  parts.push(`- Journal: ${path.join(stateDir, 'journal.md').replace(/\\/g, '/')}`)
  if (fs.existsSync(path.join(stateDir, 'plan.md'))) {
    parts.push(`- Plan: ${path.join(stateDir, 'plan.md').replace(/\\/g, '/')}`)
  }
  if (fs.existsSync(path.join(stateDir, 'findings.md'))) {
    parts.push(`- Findings: ${path.join(stateDir, 'findings.md').replace(/\\/g, '/')}`)
  }

  return parts.join('\n')
}

// --- Claude Execution ---

function runClaude(prompt, cwd, stateDir, iteration) {
  const taskConfig = JSON.parse(fs.readFileSync(path.join(stateDir, 'config.json'), 'utf8'))

  const promptFile = path.join(stateDir, `.prompt-iter-${iteration}.tmp`)
  fs.writeFileSync(promptFile, prompt)

  const claudeArgs = [
    '-p', prompt,
    '--dangerously-skip-permissions',
    '--output-format', 'text',
    '--max-turns', String(taskConfig.maxTurns)
  ]

  if (taskConfig.model) {
    claudeArgs.push('--model', taskConfig.model)
  }

  log(stateDir, `Running: claude -p [prompt] --dangerously-skip-permissions --max-turns ${taskConfig.maxTurns}`)

  try {
    const output = execSync(`claude ${claudeArgs.map(a => `"${a}"`).join(' ')}`, {
      cwd,
      encoding: 'utf8',
      maxBuffer: 50 * 1024 * 1024,
      timeout: 600000,
      stdio: ['pipe', 'pipe', 'pipe']
    })

    const iterLogPath = path.join(stateDir, `iteration-${iteration}.log`)
    fs.writeFileSync(iterLogPath, output)
    log(stateDir, `Claude output saved to iteration-${iteration}.log (${output.length} chars)`)

    try { fs.unlinkSync(promptFile) } catch {}
    return output
  } catch (err) {
    const errorOutput = err.stdout || err.stderr || err.message
    log(stateDir, `Claude error in iteration ${iteration}: ${errorOutput.slice(0, 500)}`)

    const iterLogPath = path.join(stateDir, `iteration-${iteration}.error.log`)
    fs.writeFileSync(iterLogPath, errorOutput)

    try { fs.unlinkSync(promptFile) } catch {}
    return errorOutput
  }
}

// --- Utility Functions ---

function parseArgs(args) {
  const config = {
    taskType: null,
    taskId: null,
    maxIterations: 10,
    completionPromise: 'DONE',
    cwd: process.cwd(),
    help: false,
    maxTurns: 50,
    model: null
  }

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--help': case '-h':
        config.help = true
        break
      case '--task-type':
        config.taskType = args[++i]
        break
      case '--task-id':
        config.taskId = args[++i]
        break
      case '--max-iterations':
        config.maxIterations = parseInt(args[++i]) || 0
        break
      case '--completion-promise':
        config.completionPromise = args[++i]
        break
      case '--cwd':
        config.cwd = args[++i]
        break
      case '--max-turns':
        config.maxTurns = parseInt(args[++i]) || 50
        break
      case '--model':
        config.model = args[++i]
        break
    }
  }

  return config
}

function validateConfig(config) {
  if (!config.taskType) {
    console.error('Error: --task-type required (implement|review|refactor|test|debug|migrate|docs|perf)')
    process.exit(1)
  }
  if (!config.taskId) {
    console.error('Error: --task-id required')
    process.exit(1)
  }
  const validTypes = ['implement', 'review', 'refactor', 'test', 'debug', 'migrate', 'docs', 'perf']
  if (!validTypes.includes(config.taskType)) {
    console.error(`Error: --task-type must be one of: ${validTypes.join(', ')}`)
    process.exit(1)
  }
}

function printHelp() {
  console.log(`
Ralph Runner v2 — External Loop Engine with Phase Orchestration

USAGE:
  node ralph-runner.js --task-type <type> --task-id <id> [OPTIONS]

OPTIONS:
  --task-type <type>          Loop type: implement|review|refactor|test|debug|migrate|docs|perf
  --task-id <id>              Task identifier (ticket ID, PR number, description slug)
  --max-iterations <n>        Max iterations for simple loops (default: 10, 0 = unlimited)
  --completion-promise <text> Promise phrase for simple loops (default: DONE)
  --cwd <path>                Working directory (default: current)
  --max-turns <n>             Max turns per claude -p call (default: 50)
  --model <model>             Model override (e.g., sonnet, opus)
  -h, --help                  Show this help

PHASE ORCHESTRATION:
  If phases.json exists in the state dir, the runner executes phases sequentially.
  Each phase has its own prompt, max iterations, and completion promise.
  See ralph-implement skill for an example of phase setup.

MONITORING:
  tail -f .claude/ralph-state/<task-id>/output.log

CANCEL:
  Use /ralph-cancel inside Claude Code, or:
  kill $(cat .claude/ralph-state/<task-id>/runner.pid)
  `)
}

function ensureStateDir(cwd, taskId) {
  const stateDir = path.join(cwd, '.claude', 'ralph-state', taskId)
  fs.mkdirSync(stateDir, { recursive: true })
  return stateDir
}

function writeConfig(stateDir, config) {
  const configPath = path.join(stateDir, 'config.json')
  fs.writeFileSync(configPath, JSON.stringify({
    taskType: config.taskType,
    taskId: config.taskId,
    maxIterations: config.maxIterations,
    completionPromise: config.completionPromise,
    maxTurns: config.maxTurns,
    model: config.model,
    cwd: config.cwd,
    startedAt: new Date().toISOString()
  }, null, 2))
}

function writePid(stateDir) {
  fs.writeFileSync(path.join(stateDir, 'runner.pid'), String(process.pid))
}

function cleanupPid(stateDir) {
  try { fs.unlinkSync(path.join(stateDir, 'runner.pid')) } catch {}
}

function readIteration(stateDir) {
  const iterPath = path.join(stateDir, '.iteration')
  try {
    return parseInt(fs.readFileSync(iterPath, 'utf8').trim()) || 1
  } catch {
    return 1
  }
}

function writeIteration(stateDir, n) {
  fs.writeFileSync(path.join(stateDir, '.iteration'), String(n))
}

function log(stateDir, message) {
  const logPath = path.join(stateDir, 'output.log')
  const timestamp = new Date().toISOString().slice(11, 19)
  const line = `[${timestamp}] ${message}\n`
  fs.appendFileSync(logPath, line)
  process.stdout.write(line)
}

function notify(message) {
  try {
    execSync(
      `powershell -NoProfile -Command "[System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms') | Out-Null; $n = New-Object System.Windows.Forms.NotifyIcon; $n.Icon = [System.Drawing.SystemIcons]::Information; $n.Visible = $true; $n.ShowBalloonTip(5000, 'Ralph Loop', '${message.replace(/'/g, "''")}', 'Info'); Start-Sleep -Seconds 2; $n.Dispose()"`,
      { stdio: 'ignore', timeout: 10000 }
    )
  } catch {}
}

function compactJournalIfNeeded(stateDir, threshold) {
  const journalPath = path.join(stateDir, 'journal.md')
  if (!fs.existsSync(journalPath)) return

  const content = fs.readFileSync(journalPath, 'utf8')
  const iterationBlocks = content.split(/^## Itera/m).filter(Boolean)

  if (iterationBlocks.length <= threshold + 1) return

  log(stateDir, `Compacting journal: ${iterationBlocks.length - 1} iterations found, threshold ${threshold}`)

  const lines = content.split('\n')
  const headerEnd = lines.findIndex((l, i) => i > 0 && l.startsWith('## '))
  const header = lines.slice(0, headerEnd > 0 ? headerEnd : 1).join('\n')

  const iterations = []
  let currentIter = null

  for (const line of lines) {
    const iterMatch = line.match(/^## Itera[çc][aã]o (\d+)\s*(.*)$/)
    if (iterMatch) {
      if (currentIter) iterations.push(currentIter)
      currentIter = { num: parseInt(iterMatch[1]), status: iterMatch[2].trim(), lines: [line] }
    } else if (line.startsWith('## Resumo')) {
      if (currentIter) iterations.push(currentIter)
      currentIter = null
    } else if (currentIter) {
      currentIter.lines.push(line)
    }
  }
  if (currentIter) iterations.push(currentIter)

  if (iterations.length <= threshold) return

  const toCompact = iterations.slice(0, iterations.length - threshold)
  const toKeep = iterations.slice(iterations.length - threshold)

  const summaryLines = toCompact.map(iter => {
    const body = iter.lines.join('\n')
    const criterion = body.match(/Crit[eé]rio:?\s*"?(.+?)"?\s*$/m)?.[1] || 'N/A'
    const commit = body.match(/Commit:?\s*(.+)$/m)?.[1] || ''
    const hasFailure = /falh|fail|error|erro/i.test(body)
    const lesson = body.match(/Li[çc][aã]o:?\s*(.+)$/m)?.[1] || ''

    let line = `- ${iter.status || '?'} Itera ${iter.num}: ${criterion}`
    if (commit) line += ` — ${commit}`
    if (hasFailure && lesson) line += ` | Licao: ${lesson}`
    return line
  })

  const newContent = [
    header,
    '',
    `## Resumo (iteracoes 1-${toCompact[toCompact.length - 1].num})`,
    ...summaryLines,
    '',
    ...toKeep.flatMap(iter => [...iter.lines, ''])
  ].join('\n')

  fs.writeFileSync(journalPath, newContent)
  log(stateDir, `Journal compacted: ${toCompact.length} iterations summarized, ${toKeep.length} kept detailed`)
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
