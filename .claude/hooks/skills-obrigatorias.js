#!/usr/bin/env node
/**
 * UserPromptSubmit — injeta as skills obrigatorias conforme a intencao do prompt.
 *
 * Motivo: depender de eu lembrar de invocar skill nao funciona. Numa sessao inteira
 * de review de PR eu nao carreguei code-review-comments nem escrita-felipe, e os
 * comentarios sairam sem acento, com label de template e verbosos. Hook resolve,
 * memoria nao.
 *
 * Isto NAO invoca a skill sozinho (hook nao chama tool). Ele coloca a exigencia no
 * contexto antes da primeira acao, que e o momento em que a decisao e tomada.
 */

const REGRAS = [
  {
    nome: 'review de PR',
    quando: /\b(review|revisar|revise|revisão|comenta(r)? (a |na )?pr|code.?review|aponta(r)? (tudo|os erros))\b/i,
    skills: [
      ['pr-jira-review', 'pipeline do review: spec, ultrathink, simplify'],
      ['code-quality', 'os eixos que voce vai avaliar: CQS, DRY, SOLID, KISS, aninhamento'],
      ['code-review-comments', 'COMO escrever: sem label de template, sem header, severidade implicita, acentuacao impecavel'],
      ['escrita-felipe', 'a voz: conciso, sem travessao, afirma a conclusao'],
    ],
  },
  {
    nome: 'abrir PR ou commitar',
    quando: /\b(abrir? (a )?pr|criar? (a )?pr|open.?pr|commit(ar)?|salvar versão|salvar versao)\b/i,
    skills: [
      ['verificar-entrega', 'gate obrigatorio antes de abrir PR e antes de escrever "verificado"'],
      ['escrita-felipe', 'mensagem de commit e corpo de PR na voz certa'],
    ],
  },
  {
    nome: 'escrever ou alterar codigo',
    quando: /\b(implementa|escrever? (o )?código|refator|corrig(ir|e)|criar? (a )?função|nova feature)\b/i,
    skills: [
      ['code-quality', 'CUPID, SOLID, DRY, early return, carga cognitiva'],
      ['verificar-entrega', 'antes de dizer que terminou'],
    ],
  },
  {
    nome: 'criar ou editar skill',
    quando: /\b(criar? (uma )?skill|nova skill|editar? (a )?skill|melhorar? (a )?skill)\b/i,
    skills: [
      ['criar-skill', 'estrutura, frontmatter, quando dividir em referencias'],
      ['escrita-felipe', 'a skill e lida por voce depois'],
    ],
  },
  {
    nome: 'responder review recebido',
    quando: /\b(responder? (o |os )?(review|coment)|resolver? (as )?thread)\b/i,
    skills: [
      ['code-review-comments', 'tom da resposta'],
      ['escrita-felipe', 'referenciar commit pelo nome, nunca pelo hash'],
    ],
  },
]

let bruto = ''
process.stdin.on('data', (c) => (bruto += c))
process.stdin.on('end', () => {
  let evento
  try { evento = JSON.parse(bruto) } catch { process.exit(0) }

  const prompt = evento?.prompt || evento?.user_prompt || ''
  if (!prompt || prompt.length > 4000) process.exit(0)

  const casadas = REGRAS.filter((r) => r.quando.test(prompt))
  if (!casadas.length) process.exit(0)

  // Dedup: a mesma skill pode ser exigida por duas regras.
  const vistas = new Map()
  for (const r of casadas) {
    for (const [nome, porque] of r.skills) {
      if (!vistas.has(nome)) vistas.set(nome, porque)
    }
  }

  const linhas = [...vistas].map(([n, p]) => `- \`${n}\`: ${p}`).join('\n')
  const contextos = casadas.map((r) => r.nome).join(', ')

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext:
        `O prompt indica: ${contextos}. Invoque estas skills via Skill ANTES da primeira ` +
        `acao, nao depois de ja ter escrito algo:\n\n${linhas}\n\n` +
        `Quando pr-jira-review e code-review-comments divergirem sobre formato, ` +
        `code-review-comments manda: nada de prefixo [Qualidade]/[Simplify], nada de ` +
        `"**Bloqueia:**", severidade implicita no peso da frase.`,
    },
  }))
  process.exit(0)
})
