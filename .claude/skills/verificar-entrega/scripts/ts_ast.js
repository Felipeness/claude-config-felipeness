#!/usr/bin/env node
/**
 * Extrai funcoes de um arquivo TS/JS usando o compilador TypeScript do PROJETO.
 *
 * Roda com cwd = raiz onde node_modules/typescript existe, entao o require
 * resolve a versao que o projeto ja usa. Nao instala nada.
 *
 * Saida: JSON [{nome, ini, fim, params, nest}], ini/fim em indice de linha 0-based,
 * fim exclusivo, para casar com o fatiamento de lista do Python.
 *
 * Existe porque contar chave no fonte cru e mentira: chave dentro de string, de
 * template literal ou de regex conta igual. AST nao tem esse problema.
 */
// `require` resolve a partir do caminho DESTE arquivo, que mora em ~/.claude, nao
// do cwd. Sem `paths` ele nunca acha o typescript do projeto analisado, e o gate
// cai silenciosamente no fallback achando que a lib nao existe.
let ts
try {
  const raiz = process.argv[3] || process.cwd()
  ts = require(require.resolve('typescript', { paths: [raiz] }))
} catch {
  process.exit(3) // sem typescript, o chamador cai no fallback
}

const fs = require('fs')
const arquivo = process.argv[2]
if (!arquivo || !fs.existsSync(arquivo)) process.exit(4)

const fonte = ts.createSourceFile(
  arquivo,
  fs.readFileSync(arquivo, 'utf8'),
  ts.ScriptTarget.Latest,
  true,
  /\.tsx?$/.test(arquivo) ? ts.ScriptKind.TSX : ts.ScriptKind.JS,
)

const EH_FUNCAO = (n) =>
  ts.isFunctionDeclaration(n) ||
  ts.isMethodDeclaration(n) ||
  ts.isArrowFunction(n) ||
  ts.isFunctionExpression(n) ||
  ts.isConstructorDeclaration(n) ||
  ts.isGetAccessor(n) ||
  ts.isSetAccessor(n)

// Blocos que aumentam carga cognitiva. Bloco de funcao aninhada nao conta:
// funcao interna e medida separadamente, somar seria contar duas vezes.
const EH_ANINHAMENTO = (n) =>
  ts.isIfStatement(n) ||
  ts.isForStatement(n) ||
  ts.isForInStatement(n) ||
  ts.isForOfStatement(n) ||
  ts.isWhileStatement(n) ||
  ts.isDoStatement(n) ||
  ts.isSwitchStatement(n) ||
  ts.isTryStatement(n) ||
  ts.isCatchClause(n) ||
  ts.isConditionalExpression(n)

function nomeDe(n) {
  if (n.name && ts.isIdentifier(n.name)) return n.name.text
  const p = n.parent
  if (p && ts.isVariableDeclaration(p) && p.name && ts.isIdentifier(p.name)) return p.name.text
  if (p && ts.isPropertyAssignment(p) && p.name && ts.isIdentifier(p.name)) return p.name.text
  if (ts.isConstructorDeclaration(n)) return 'constructor'
  return '(anonima)'
}

function profundidade(no, atual = 0) {
  let maximo = atual
  no.forEachChild((filho) => {
    if (EH_FUNCAO(filho)) return // medida em separado
    const passo = EH_ANINHAMENTO(filho) ? atual + 1 : atual
    maximo = Math.max(maximo, profundidade(filho, passo))
  })
  return maximo
}

const linhaDe = (pos) => fonte.getLineAndCharacterOfPosition(pos).line

const out = []
function visita(no) {
  if (EH_FUNCAO(no)) {
    // Arrow de uma expressao so (`x => x * 2`) nao e funcao que vale medir.
    const corpoEhBloco = no.body && ts.isBlock(no.body)
    if (corpoEhBloco || !ts.isArrowFunction(no)) {
      const nomes = (no.parameters || [])
        .filter((p) => p.name && ts.isIdentifier(p.name) && p.name.text !== 'this')
        .map((p) => p.name.text)
      out.push({
        nome: nomeDe(no),
        ini: linhaDe(no.getStart(fonte)),
        fim: linhaDe(no.getEnd()) + 1,
        params: (no.parameters || []).length,
        nomes_params: nomes,
        nest: profundidade(no),
      })
    }
  }
  no.forEachChild(visita)
}
visita(fonte)

process.stdout.write(JSON.stringify(out))
