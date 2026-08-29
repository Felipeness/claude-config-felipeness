#!/usr/bin/env node
/**
 * PreToolUse / Bash — roda o gate verificar-entrega antes de `gh pr create`.
 *
 * FALHOU  -> nega a criacao da PR e devolve o motivo pro modelo.
 * ATENCAO -> deixa passar, mas injeta os avisos pra entrarem na descricao.
 *
 * Existe porque "lembrar de rodar o check" nao funcionou. O gate so vale se
 * for o caminho, nao um passo opcional antes dele.
 */
const { execFileSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const CHECK = path.join(process.env.USERPROFILE || process.env.HOME, '.claude', 'skills', 'verificar-entrega', 'scripts', 'check.sh')

function ler(stdin) {
  try { return JSON.parse(stdin) } catch { return null }
}

function saida(obj) {
  process.stdout.write(JSON.stringify(obj))
  process.exit(0)
}

let bruto = ''
process.stdin.on('data', (c) => (bruto += c))
/**
 * Diretorio em que o comando vai rodar de verdade.
 *
 * O gate roda `check.sh`, que le o git do diretorio corrente. Sem isso, um
 * `cd outro-repo && ...` era medido contra o repo da sessao: a contagem de
 * commits vinha do repo errado e o gate reprovava PR legitima ("acima de 50
 * commits" numa branch de 1 commit).
 */
function cwdDoComando(cmd) {
  const criacao = cmd.search(/\bgh\s+pr\s+create\b/)
  const antes = criacao < 0 ? cmd : cmd.slice(0, criacao)
  // separador antes do `cd`: inicio, operador de shell, ou qualquer espaco
  // (inclui quebra de linha, que e o caso de heredoc seguido de cd)
  const padrao = /(?:^|[\s&|;])\s*cd\s+(?:"([^"]+)"|'([^']+)'|([^\s&|;]+))/g
  const alvos = []
  for (const m of antes.matchAll(padrao)) alvos.push(m[1] || m[2] || m[3])
  // o ultimo `cd` antes do comando e o diretorio em que ele roda de fato
  for (const alvo of alvos.reverse()) {
    for (const candidato of [paraWindows(alvo), alvo]) {
      try {
        if (fs.statSync(candidato).isDirectory()) return candidato
      } catch {
        // tenta a proxima forma do caminho
      }
    }
  }
  return process.cwd()
}

/**
 * Git Bash entrega `/c/Users/...`, que o fs do Node no Windows nao resolve.
 * Sem esta traducao o gate caia no fallback e voltava a medir o repo errado.
 */
function paraWindows(p) {
  const m = /^\/([a-zA-Z])\/(.*)$/.exec(p)
  if (!m) return p
  const BARRA = String.fromCharCode(92)
  return m[1].toUpperCase() + ':' + BARRA + m[2].split('/').join(BARRA)
}

process.stdin.on('end', () => {
  const evento = ler(bruto)
  const cmd = evento?.tool_input?.command || ''

  // So intercepta criacao de PR. `gh pr view`, `gh pr list` etc passam direto.
  if (!/\bgh\s+pr\s+create\b/.test(cmd)) saida({})
  if (!fs.existsSync(CHECK)) saida({})

  // --no-gate como escotilha de emergencia, deliberadamente feia de digitar.
  if (/--no-gate/.test(cmd)) {
    saida({ systemMessage: 'Gate verificar-entrega pulado por --no-gate.' })
  }

  let stdout = ''
  let falhou = false
  try {
    stdout = execFileSync('bash', [CHECK], {
      cwd: cwdDoComando(cmd),
      encoding: 'utf8',
      timeout: 120000,
      maxBuffer: 10 * 1024 * 1024,
    })
  } catch (e) {
    // exit 1 = FALHOU. exit 2 = erro de uso (base inexistente), nao bloqueia.
    stdout = (e.stdout || '') + (e.stderr || '')
    if (e.status === 1) falhou = true
    if (e.status === 2 || e.status === undefined) {
      saida({ systemMessage: 'Gate verificar-entrega nao pode rodar aqui, seguindo sem ele.' })
    }
  }

  const limpo = stdout.replace(/\x1b\[[0-9;]*m/g, '')
  const falhas = limpo.split('\n').filter((l) => l.includes('FALHOU'))
  const avisos = limpo.split('\n').filter((l) => l.includes('ATENCAO'))

  if (falhou && falhas.length) {
    saida({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason:
          'O gate verificar-entrega falhou. Corrija antes de abrir a PR, e nao escreva ' +
          '"verificado/testado/validado" na descricao enquanto nao passar.\n\n' +
          falhas.join('\n') +
          '\n\nSe algum item for falso positivo, aperte a regra em ' +
          '~/.claude/skills/verificar-entrega/scripts/desenho.py e rode a bateria de ' +
          'regressao da SKILL.md antes de seguir. Emergencia real: --no-gate.',
      },
    })
  }

  if (avisos.length) {
    saida({
      systemMessage: `Gate passou com ${avisos.length} aviso(s).`,
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        additionalContext:
          'O gate verificar-entrega passou com avisos. Justifique cada um na descricao ' +
          'da PR, em uma frase:\n' + avisos.join('\n'),
      },
    })
  }

  saida({ systemMessage: 'Gate verificar-entrega: limpo.' })
})
