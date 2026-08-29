#!/usr/bin/env node
/**
 * PreToolUse (Agent|Task) — brief de agente com tarefa de codigo DEVE instruir
 * as skills obrigatorias do tema. Minimo universal: code-quality.
 *
 * Motivo: o skills-obrigatorias.js cobre o thread principal, mas subagente nao
 * herda essa exigencia. Brief sem skill gera codigo fora do padrao que depois
 * reprova no gate. Nega o despacho e o orquestrador re-despacha com o brief certo.
 *
 * Fail-open por design: hook de qualidade nao pode derrubar despacho legitimo
 * por erro de parse.
 */

// Tipos read-only ou com protocolo proprio (plugins usam prefixo com ':').
const TIPOS_ISENTOS = new Set(['Explore', 'Plan', 'claude-code-guide', 'statusline-setup', 'fork'])

// Dois sinais pra reduzir falso positivo: verbo de escrita + substantivo de codigo.
const VERBO_ESCRITA = /\b(implement\w*|corrig\w*|conserte|fix|refator\w*|refactor\w*|adicion\w*|add(ing)?|crie|criar|create|escrev\w*|write|desenvolv\w*|migr(e|ar|ate)|otimiz\w*|optimize)\b/i
const SUBSTANTIVO_CODIGO = /\b(c[oó]digo|code|fun[cç][aã]o|function|componente|component|endpoint|rota|route|classe|class|m[eé]todo|method|teste?s?|test|bug|feature|hook|servi[cç]o|service|api|handler|m[oó]dulo|module|script|migration|query)\b|\.(ts|tsx|js|jsx|go|py|rs|java|php|rb|cs)\b/i

let bruto = ''
process.stdin.on('data', (c) => (bruto += c))
process.stdin.on('end', () => {
  let entrada
  try { entrada = JSON.parse(bruto).tool_input ?? {} } catch { process.exit(0) }

  const tipo = entrada.subagent_type || 'general-purpose'
  if (TIPOS_ISENTOS.has(tipo) || tipo.includes(':')) process.exit(0)

  const prompt = typeof entrada.prompt === 'string' ? entrada.prompt : ''
  const tarefaDeCodigo = VERBO_ESCRITA.test(prompt) && SUBSTANTIVO_CODIGO.test(prompt)
  if (!tarefaDeCodigo || /code-quality/i.test(prompt)) process.exit(0)

  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason:
        'Brief de tarefa de codigo sem skills obrigatorias. Re-despache incluindo no prompt a instrucao de ' +
        'invocar `code-quality` (sempre, nao importa a tarefa) + a skill da linguagem (typescript/go/react/nestjs), ' +
        'e confira no CLAUDE.md a tabela "Skills obrigatorias por tema" para o que mais casar ' +
        '(frontend-design, api-design, functional-programming, observability, refactoring...).',
    },
  }))
  process.exit(0)
})
