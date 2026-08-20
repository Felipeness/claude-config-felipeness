#!/usr/bin/env bash
# Gate mecanico antes de abrir PR.
# Uso: bash check.sh [base]     (base default: origin/master, fallback origin/main)
set -uo pipefail

BASE="${1:-}"
if [ -z "$BASE" ]; then
  if git rev-parse --verify -q origin/master >/dev/null; then BASE=origin/master
  elif git rev-parse --verify -q origin/main >/dev/null; then BASE=origin/main
  else echo "nao achei origin/master nem origin/main. passe a base: check.sh <base>"; exit 2; fi
fi
git rev-parse --verify -q "$BASE" >/dev/null || { echo "base '$BASE' nao existe"; exit 2; }

MERGE_BASE=$(git merge-base "$BASE" HEAD 2>/dev/null) || MERGE_BASE="$BASE"
# uniao de: commitado na branch + staged + working tree + untracked.
# so olhar o commitado deixa passar exatamente o que voce acabou de escrever.
FILES=$( { git diff --name-only "$MERGE_BASE"...HEAD 2>/dev/null
           git diff --name-only --cached 2>/dev/null
           git diff --name-only 2>/dev/null
           git ls-files --others --exclude-standard 2>/dev/null
         } | sort -u | grep -v '^$' || true)

# diff textual usado nas checagens de linha adicionada (commitado + staged + working tree)
diff_added() { # $1 = arquivo (opcional)
  { git diff "$MERGE_BASE"...HEAD -- ${1:+"$1"} 2>/dev/null
    git diff HEAD -- ${1:+"$1"} 2>/dev/null
  } | grep -E '^\+' || true
}

if [ -z "$FILES" ]; then echo "nenhum arquivo alterado em relacao a $BASE"; exit 0; fi

FAIL=0; WARN=0
red()  { printf '\033[31m%s\033[0m\n' "$*"; }
ylw()  { printf '\033[33m%s\033[0m\n' "$*"; }
grn()  { printf '\033[32m%s\033[0m\n' "$*"; }
fail() { red   "  FALHOU  $*"; FAIL=1; }
warn() { ylw   "  ATENCAO $*"; WARN=1; }
ok()   { grn   "  ok      $*"; }

# arquivos por categoria
CODE=$(echo "$FILES"   | grep -E '\.(js|jsx|ts|tsx|mjs|cjs)$' | grep -vE '\.(test|spec)\.' || true)
TESTS=$(echo "$FILES"  | grep -E '\.(test|spec)\.(js|jsx|ts|tsx|mjs)$|(^|/)__tests__/' || true)
CONFIGS=$(echo "$FILES" | grep -E '(values/.*\.ya?ml|\.env[.a-zA-Z]*|datasources.*\.(js|json))$' || true)
exists() { [ -f "$1" ]; }

echo "base: $BASE   arquivos alterados: $(echo "$FILES" | wc -l | tr -d ' ')"
echo

# ---------------------------------------------------------------- 1. RUNTIME
echo "[1] RUNTIME"
TARGET=""; SRC=""
if exists package.json; then
  TARGET=$(grep -o '"node"[[:space:]]*:[[:space:]]*"[^"]*"' package.json | head -1 | grep -oE '[0-9]+' | head -1 || true)
  [ -n "$TARGET" ] && SRC="package.json engines.node"
fi
if [ -z "$TARGET" ] && exists .nvmrc; then
  TARGET=$(grep -oE '[0-9]+' .nvmrc | head -1); SRC=".nvmrc"
fi
if [ -z "$TARGET" ]; then
  DF=$(ls Dockerfile* 2>/dev/null | head -1 || true)
  if [ -n "$DF" ]; then TARGET=$(grep -iE '^FROM .*node:' "$DF" | grep -oE 'node:[0-9]+' | grep -oE '[0-9]+' | head -1 || true); [ -n "$TARGET" ] && SRC="$DF"; fi
fi
if [ -z "$TARGET" ]; then
  T=$(grep -rhoE 'node:[0-9]+' .deploy 2>/dev/null | grep -oE '[0-9]+' | sort -n | head -1 || true)
  [ -n "$T" ] && { TARGET="$T"; SRC=".deploy"; }
fi

if [ -z "$TARGET" ]; then
  warn "nao achei a versao de Node do destino (engines.node, .nvmrc, Dockerfile, .deploy)."
  echo "          descubra e fixe em package.json engines.node antes de abrir a PR."
else
  LOCAL=$(node -v 2>/dev/null | grep -oE '[0-9]+' | head -1 || echo "?")
  echo "  destino: Node $TARGET (de $SRC)   local: Node $LOCAL"
  [ "$LOCAL" != "?" ] && [ "$LOCAL" != "$TARGET" ] && warn "seu Node local ($LOCAL) != destino ($TARGET). rode no destino antes de abrir."

  # sintaxe/API por versao minima
  check_feat() { # $1 regex  $2 versao_minima  $3 descricao
    [ "$TARGET" -ge "$2" ] && return 0
    HIT=$(echo "$CODE" | while read -r f; do [ -f "$f" ] && grep -nE "$1" "$f" | sed "s|^|$f:|"; done | head -4)
    [ -n "$HIT" ] && { fail "$3 exige Node $2+, destino e $TARGET:"; echo "$HIT" | sed 's/^/            /'; }
  }
  check_feat '\?\?[^=]|\?\?=' 14 "nullish coalescing (??)"
  check_feat '\?\.'                      14 "optional chaining (?.)"
  check_feat 'crypto\.randomUUID'        15 "crypto.randomUUID()"
  check_feat 'String\.prototype\.replaceAll|\.replaceAll\(' 15 ".replaceAll()"
  check_feat 'Object\.hasOwn'            17 "Object.hasOwn()"
  check_feat 'structuredClone'           17 "structuredClone()"
  check_feat '\.at\(-'                   17 "Array.prototype.at()"
  check_feat '\|\|=|&&='                 15 "logical assignment (||= &&=)"
  [ $FAIL -eq 0 ] && ok "nenhuma sintaxe acima do Node $TARGET no diff"
fi
echo

# ---------------------------------------------------------------- 2. TESTE
echo "[2] TESTE"
if [ -z "$TESTS" ]; then
  if [ -n "$CODE" ]; then warn "diff mexe em codigo e nao toca nenhum arquivo de teste"; else ok "sem codigo, sem teste esperado"; fi
else
  SKIP=$(echo "$TESTS" | while read -r f; do [ -f "$f" ] && grep -nE '(it|test|describe)\.(skip|only)\(|^\s*(xit|xdescribe)\(' "$f" | sed "s|^|$f:|"; done || true)
  [ -n "$SKIP" ] && { fail "teste desligado (.skip/.only/xit):"; echo "$SKIP" | head -8 | sed 's/^/            /'; }

  COMM=$(echo "$TESTS" | while read -r f; do [ -f "$f" ] && grep -nE '^\s*//\s*(expect|assert|chai)' "$f" | sed "s|^|$f:|"; done || true)
  [ -n "$COMM" ] && { fail "assert comentado:"; echo "$COMM" | head -8 | sed 's/^/            /'; }

  SLEEP=$(echo "$TESTS" | while read -r f; do [ -f "$f" ] && grep -nE 'new Promise\(.*setTimeout|await .*setTimeout\(' "$f" | sed "s|^|$f:|"; done || true)
  [ -n "$SLEEP" ] && { warn "espera por setTimeout em teste (falso positivo sob carga; use vi.waitFor/waitFor):"; echo "$SLEEP" | head -5 | sed 's/^/            /'; }

  NOEXP=$(echo "$TESTS" | while read -r f; do [ -f "$f" ] && [ "$(grep -cE '\b(expect|assert)\(' "$f")" = "0" ] && echo "$f"; done || true)
  [ -n "$NOEXP" ] && { fail "arquivo de teste sem nenhum expect/assert:"; echo "$NOEXP" | sed 's/^/            /'; }

  PATCH=$(echo "$TESTS" | while read -r f; do [ -f "$f" ] && grep -lE 'Module\.prototype\.require|process\.env\.[A-Z_]+\s*=' "$f" | while read -r g; do grep -qE 'afterAll|afterEach' "$g" || echo "$g"; done; done || true)
  [ -n "$PATCH" ] && { warn "teste altera estado global sem afterAll/afterEach (vaza entre suites):"; echo "$PATCH" | sed 's/^/            /'; }

  [ -z "$SKIP$COMM$NOEXP" ] && ok "$(echo "$TESTS" | wc -l | tr -d ' ') arquivo(s) de teste, nenhum desligado"
fi
echo

# ---------------------------------------------------------------- 3. CONFIG
echo "[3] CONFIG"
VALS=$(ls .deploy/values/*.y*ml 2>/dev/null || true)
if [ -z "$VALS" ]; then
  ok "sem .deploy/values/ para comparar"
else
  ALLK=$(grep -hoE '^\s{2,}[A-Z][A-Z0-9_]{3,}:' $VALS 2>/dev/null | tr -d ' :' | sort -u || true)
  DRIFT=0
  for f in $VALS; do
    MISS=$(comm -23 <(echo "$ALLK") <(grep -oE '^\s{2,}[A-Z][A-Z0-9_]{3,}:' "$f" | tr -d ' :' | sort -u) | tr '\n' ' ')
    [ -n "$(echo "$MISS" | tr -d ' ')" ] && { warn "$f nao tem: $MISS"; DRIFT=1; }
  done
  [ $DRIFT -eq 0 ] && ok "mesmas chaves em todos os values/*.yaml"
fi
FLAGON=$(echo "$CONFIGS" | while read -r f; do [ -f "$f" ] && echo "$f" | grep -q 'prd\|prod' && grep -nE '_(ENABLED|FLAG|TOGGLE)"?:\s*"?true' "$f" | sed "s|^|$f:|"; done || true)
[ -n "$FLAGON" ] && { warn "flag nascendo LIGADA em producao (sem rollback sem deploy):"; echo "$FLAGON" | head -5 | sed 's/^/            /'; }
echo

# ---------------------------------------------------------------- 4. TAMANHO
echo "[4] TAMANHO"
ADD=$( { git diff --numstat "$MERGE_BASE"...HEAD 2>/dev/null; git diff --numstat HEAD 2>/dev/null; }        | awk '$1 ~ /^[0-9]+$/ {s+=$1} END {print s+0}')
NF=$(echo "$FILES" | wc -l | tr -d ' ')
NC=$(git rev-list --count "$MERGE_BASE"..HEAD 2>/dev/null || echo 0)
echo "  +$ADD linhas, $NF arquivos, $NC commits"
[ "${ADD:-0}" -gt 400 ] && warn "acima de 400 linhas. fatie (Fase 3 da skill) ou justifique na descricao."
[ "$NF" -gt 20 ]        && warn "acima de 20 arquivos."
[ "${NC:-0}" -gt 50 ]   && fail "acima de 50 commits: a branch saiu da base errada. refatie do master atual."
[ "${ADD:-0}" -le 400 ] && [ "$NF" -le 20 ] && ok "tamanho revisavel"
echo

# ---------------------------------------------------------------- 5. SOBRAS
echo "[5] SOBRAS"
# Documentacao e comentario que DESCREVEM o detector nao sao o defeito. Este gate
# ja se reprovou duas vezes: primeiro por uma tabela na propria SKILL.md, depois
# pelo comentario que explicava a correcao. Falar de uma coisa nao e faze-la.
NAODOC=$(echo "$FILES" | grep -vE '\.(md|mdx|txt|rst)$' || true)
DBG=$(echo "$NAODOC" | while read -r f; do
        [ -f "$f" ] && grep -nE 'debug:[[:space:]]*true|DEBUG[[:space:]]*=[[:space:]]*true' "$f" \
          | grep -vE '^[0-9]+:[[:space:]]*(#|//|\*|--)' | sed "s|^|$f:|"
      done || true)
[ -n "$DBG" ] && { fail "debug ligado:"; echo "$DBG" | head -5 | sed 's/^/            /'; }

CLOG=$(echo "$CODE" | while read -r f; do [ -f "$f" ] && diff_added "$f" | grep -nE 'console\.(log|debug)' | sed "s|^|$f:|"; done || true)
[ -n "$CLOG" ] && { warn "console.log novo (use o logger estruturado):"; echo "$CLOG" | head -5 | sed 's/^/            /'; }

PLAN=$(echo "$FILES" | grep -E 'docs/(superpowers|plans)/|\.claude/plans/|PLANO|-plan\.md$' || true)
[ -n "$PLAN" ] && { warn "plano de execucao commitado (vira ruido permanente no repo):"; echo "$PLAN" | sed 's/^/            /'; }

TODOS=$(echo "$CODE" | while read -r f; do [ -f "$f" ] && diff_added "$f" | grep -cE 'TODO|FIXME|XXX'; done | paste -sd+ - | bc 2>/dev/null || echo 0)
[ "${TODOS:-0}" -gt 0 ] && warn "$TODOS TODO/FIXME novos no diff"

STACK=$(echo "$CODE" | while read -r f; do [ -f "$f" ] && grep -nE 'new Error\((err|error)\.message\)' "$f" | sed "s|^|$f:|"; done || true)
[ -n "$STACK" ] && { warn "new Error(error.message) perde o stack original. use 'throw error' ou { cause }:"; echo "$STACK" | head -4 | sed 's/^/            /'; }

[ -z "$DBG$CLOG$PLAN$STACK" ] && [ "${TODOS:-0}" -eq 0 ] && ok "sem sobras"
echo

# ---------------------------------------------------------------- 6. SEGREDO
echo "[6] SEGREDO"
# so em arquivo de producao: fixture de teste com credencial falsa e esperado
PRODF=$(echo "$FILES" | grep -vE '\.(test|spec)\.|(^|/)(__tests__|__mocks__|fixtures|test|tests)/' || true)
SEC=$(echo "$PRODF" | while read -r f; do
        [ -f "$f" ] || continue
        git diff "$MERGE_BASE"...HEAD -- "$f" 2>/dev/null | grep -E '^\+' \
          | grep -inE '(api[_-]?key|secret|password|passwd|token|authorization)[[:space:]]*[:=][[:space:]]*["'\''][^"'\'']{12,}' \
          | grep -viE 'process\.env|placeholder|example|xxx|\*\*\*|fake|dummy|redacted|<[a-z]' | sed "s|^|$f:|"
      done | head -5 || true)
[ -n "$SEC" ] && { fail "possivel credencial em arquivo de producao:"; echo "$SEC" | sed 's/^/            /'; }
[ -z "$SEC" ] && ok "nada aparente em arquivo de producao"
echo

# ---------------------------------------------------------------- 7. DESENHO
echo "[7] DESENHO"
DESENHO="$(dirname "${BASH_SOURCE[0]}")/desenho.py"
PY=$(command -v python3 || command -v python || true)
if [ -z "$PY" ]; then
  warn "python nao encontrado, fase de desenho pulada"
elif [ ! -f "$DESENHO" ]; then
  warn "desenho.py nao encontrado ao lado do check.sh"
else
  ALVOS=$(echo "$FILES" | grep -E '\.(py|ts|tsx|js|jsx|mjs|php|phtml)$' | grep -vE '\.(test|spec)\.' || true)
  if [ -z "$ALVOS" ]; then
    ok "nenhum arquivo de codigo no diff"
  else
    OUT=$(DESENHO_BASE="$MERGE_BASE" "$PY" "$DESENHO" $ALVOS 2>&1)
    echo "$OUT" | sed 's/^  FALHOU/\x1b[31m  FALHOU\x1b[0m/; s/^  ATENCAO/\x1b[33m  ATENCAO\x1b[0m/; s/^  ok/\x1b[32m  ok\x1b[0m/'
    echo "$OUT" | grep -q "FALHOU" && FAIL=1
    echo "$OUT" | grep -q "ATENCAO" && WARN=1
  fi
fi
echo

# ---------------------------------------------------------------- resultado
echo "--------------------------------------------------"
if [ $FAIL -eq 1 ]; then
  red "RESULTADO: FALHOU. nao abra a PR e nao escreva 'verificado'."
  exit 1
elif [ $WARN -eq 1 ]; then
  ylw "RESULTADO: PASSOU COM ATENCAO. justifique cada ATENCAO na descricao da PR."
  exit 0
else
  grn "RESULTADO: LIMPO."
  exit 0
fi
