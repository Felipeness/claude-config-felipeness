// Ralph Loop v2 — Stop Hook (Node.js)
// Hybrid mode: detects external runner (ralph-runner.js) and stays out of the way.
// Falls back to legacy in-session loop if no external runner is active.
// Exit 0 = allow stop, JSON output with decision:"block" = continue loop

const fs = require('fs')
const path = require('path')

let input = ''
process.stdin.on('data', chunk => input += chunk)
process.stdin.on('end', () => {
  try {
    const hookInput = JSON.parse(input)
    handleStop(hookInput)
  } catch {
    process.exit(0)
  }
})

function handleStop(hookInput) {
  const cwd = hookInput.cwd || process.cwd()

  // --- v2: Check for external runner ---
  // If ralph-runner.js is managing the loop, the stop hook should NOT interfere.
  // The runner handles iteration via separate `claude -p` calls.
  const stateBaseDir = path.join(cwd, '.claude', 'ralph-state')
  if (fs.existsSync(stateBaseDir)) {
    try {
      const taskDirs = fs.readdirSync(stateBaseDir)
      for (const taskDir of taskDirs) {
        const pidPath = path.join(stateBaseDir, taskDir, 'runner.pid')
        if (fs.existsSync(pidPath)) {
          const pid = parseInt(fs.readFileSync(pidPath, 'utf8').trim())
          if (pid && isProcessRunning(pid)) {
            // External runner is active — allow Claude to stop normally
            // The runner will launch a new `claude -p` session
            process.exit(0)
          }
        }
      }
    } catch { /* ignore errors, fall through to legacy */ }
  }

  // --- v1 Legacy: In-session loop (backwards compat) ---
  const stateFile = path.join(cwd, '.claude', 'ralph-loop.local.md')

  if (!fs.existsSync(stateFile)) process.exit(0)

  let content
  try {
    content = fs.readFileSync(stateFile, 'utf8')
  } catch {
    process.exit(0)
  }

  const { frontmatter, body } = parseFrontmatter(content)
  if (!frontmatter) {
    fs.unlinkSync(stateFile)
    process.exit(0)
  }

  const iteration = parseInt(frontmatter.iteration) || 1
  const maxIterations = parseInt(frontmatter.max_iterations) || 10
  const completionPromise = frontmatter.completion_promise || 'DONE'
  const taskType = frontmatter.task_type || 'unknown'
  const taskInput = frontmatter.task_input || ''

  const lastMessage = hookInput.last_assistant_message || extractFromTranscript(hookInput.transcript_path)

  const promiseRegex = new RegExp(`<promise>\\s*${escapeRegex(completionPromise)}\\s*</promise>`, 's')
  if (promiseRegex.test(lastMessage)) {
    process.stderr.write(`Ralph Loop: task complete! (${taskType}: ${taskInput}, ${iteration} iterations)\n`)
    cleanup(stateFile)
    process.exit(0)
  }

  if (maxIterations > 0 && iteration >= maxIterations) {
    process.stderr.write(`Ralph Loop: max iterations reached (${iteration}/${maxIterations}). Stopping.\n`)
    cleanup(stateFile)
    process.exit(0)
  }

  const nextIteration = iteration + 1
  const updatedContent = content.replace(/^iteration:\s*\d+/m, `iteration: ${nextIteration}`)

  try {
    fs.writeFileSync(stateFile, updatedContent, 'utf8')
  } catch {
    process.exit(0)
  }

  const systemMsg = `Ralph Loop iteration ${nextIteration}/${maxIterations} | ${taskType}: ${taskInput} | Output <promise>${completionPromise}</promise> when done`

  const continuationPrompt = body.trim()
    ? `[Ralph Loop — iteration ${nextIteration}/${maxIterations}]\n\n${body.trim()}`
    : `[Ralph Loop — iteration ${nextIteration}/${maxIterations}] Continue working on the task. Output <promise>${completionPromise}</promise> when complete.`

  process.stdout.write(JSON.stringify({
    decision: 'block',
    reason: continuationPrompt,
    systemMessage: systemMsg
  }))
  process.exit(0)
}

function isProcessRunning(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

function extractFromTranscript(transcriptPath) {
  if (!transcriptPath) return ''
  try {
    const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n').filter(Boolean)
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const entry = JSON.parse(lines[i])
        if (entry.role === 'assistant' && entry.message?.content) {
          return entry.message.content
            .filter(c => c.type === 'text')
            .map(c => c.text)
            .join('\n')
        }
      } catch { continue }
    }
  } catch {}
  return ''
}

function parseFrontmatter(content) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/)
  if (!match) return { frontmatter: null, body: content }

  const frontmatter = {}
  match[1].split('\n').forEach(line => {
    const kv = line.match(/^(\w+):\s*(.*)$/)
    if (kv) {
      let val = kv[2].trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      frontmatter[kv[1]] = val
    }
  })

  return { frontmatter, body: match[2] }
}

function cleanup(stateFile) {
  try { fs.unlinkSync(stateFile) } catch {}
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
