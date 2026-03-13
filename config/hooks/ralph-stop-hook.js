// Ralph Loop — Stop Hook (Node.js)
// Intercepts Claude's stop event and re-injects the prompt if the task isn't done.
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
  const stateFile = path.join(cwd, '.claude', 'ralph-loop.local.md')

  // No active loop — allow stop
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

  // Get last assistant message
  const lastMessage = hookInput.last_assistant_message || extractFromTranscript(hookInput.transcript_path)

  // Check for completion promise
  const promiseRegex = new RegExp(`<promise>\\s*${escapeRegex(completionPromise)}\\s*</promise>`, 's')
  if (promiseRegex.test(lastMessage)) {
    process.stderr.write(`Ralph Loop: task complete! (${taskType}: ${taskInput}, ${iteration} iterations)\n`)
    cleanup(stateFile, cwd, taskInput)
    process.exit(0)
  }

  // Check max iterations
  if (maxIterations > 0 && iteration >= maxIterations) {
    process.stderr.write(`Ralph Loop: max iterations reached (${iteration}/${maxIterations}). Stopping.\n`)
    cleanup(stateFile, cwd, taskInput)
    process.exit(0)
  }

  // Continue loop — increment iteration and re-inject prompt
  const nextIteration = iteration + 1
  const updatedContent = content.replace(
    /^iteration:\s*\d+/m,
    `iteration: ${nextIteration}`
  )

  try {
    fs.writeFileSync(stateFile, updatedContent, 'utf8')
  } catch {
    // If we can't write, allow stop gracefully
    process.exit(0)
  }

  const systemMsg = `Ralph Loop iteration ${nextIteration}/${maxIterations} | ${taskType}: ${taskInput} | Output <promise>${completionPromise}</promise> when done`

  const continuationPrompt = body.trim()
    ? `[Ralph Loop — iteration ${nextIteration}/${maxIterations}]\n\n${body.trim()}`
    : `[Ralph Loop — iteration ${nextIteration}/${maxIterations}] Continue working on the task. Output <promise>${completionPromise}</promise> when complete.`

  // Output JSON to block stop and re-inject prompt
  const output = JSON.stringify({
    decision: 'block',
    reason: continuationPrompt,
    systemMessage: systemMsg
  })

  process.stdout.write(output)
  process.exit(0)
}

function extractFromTranscript(transcriptPath) {
  if (!transcriptPath) return ''
  try {
    const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n').filter(Boolean)
    // Read from the end to find last assistant message
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
  } catch { /* ignore */ }
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
      // Remove surrounding quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      frontmatter[kv[1]] = val
    }
  })

  return { frontmatter, body: match[2] }
}

function cleanup(stateFile, cwd, taskInput) {
  try { fs.unlinkSync(stateFile) } catch { /* ignore */ }
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
