// Hook: PostToolUse (Bash)
// Detecta `gh pr create --base master` em repos echo-atende e lembra de criar PR espelho para develop
// Retorna systemMessage com instrução para usar /mirror-pr

const ECHO_ATENDE_REPOS = ['echo-atende-backend', 'echo-atende-frontend']

let input = ''
process.stdin.on('data', chunk => input += chunk)
process.stdin.on('end', () => {
  try {
    const { tool_input, tool_response } = JSON.parse(input)
    const command = tool_input?.command || ''
    const output = typeof tool_response === 'string' ? tool_response : JSON.stringify(tool_response || '')

    // So ativa em gh pr create com --base master
    if (!/gh\s+pr\s+create/.test(command)) process.exit(0)
    if (!/--base\s+master/.test(command)) process.exit(0)

    // Checa se é repo echo-atende (pelo --repo flag ou pelo output da PR URL)
    const isEchoAtende = ECHO_ATENDE_REPOS.some(repo =>
      command.includes(repo) || output.includes(repo)
    )
    if (!isEchoAtende) process.exit(0)

    // Extrai URL da PR criada
    const prUrl = output.match(/https:\/\/github\.com\/\S+\/pull\/\d+/)
    const prRef = prUrl ? prUrl[0] : 'a PR'

    const result = {
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: [
          `[MIRROR-PR] PR criada em master: ${prRef}`,
          'Este repo requer PR espelho para develop (cherry-pick).',
          'Crie agora a PR espelho: checkout develop, cherry-pick os commits, push branch -dev, gh pr create --base develop.',
          'Referencia a PR master no body da PR develop.'
        ].join('\n')
      }
    }
    process.stdout.write(JSON.stringify(result))
  } catch {
    // ignora erros
  }
  process.exit(0)
})
