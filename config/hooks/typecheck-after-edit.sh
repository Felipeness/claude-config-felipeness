#!/bin/bash
set -o pipefail
# Hook: PostToolUse (Edit|Write)
# Roda typecheck apos editar arquivos TS/TSX/JS/JSX
# Usa node ao inves de jq

INPUT=$(cat)

# Extrai file_path do JSON via node
FILE_PATH=$(echo "$INPUT" | node -e "
  let d='';
  process.stdin.on('data',c=>d+=c);
  process.stdin.on('end',()=>{
    try { console.log(JSON.parse(d).tool_input.file_path||''); }
    catch(e) { console.log(''); }
  });
")

# Sai silenciosamente se nao tem file_path
[ -z "$FILE_PATH" ] && exit 0

# So roda pra arquivos TS/JS
case "$FILE_PATH" in
  *.ts|*.tsx|*.js|*.jsx) ;;
  *) exit 0 ;;
esac

# Encontra o diretorio do projeto (subindo ate achar tsconfig.json)
DIR=$(dirname "$FILE_PATH")
PROJECT_DIR=""
while [ "$DIR" != "/" ] && [ "$DIR" != "." ]; do
  if [ -f "$DIR/tsconfig.json" ]; then
    PROJECT_DIR="$DIR"
    break
  fi
  DIR=$(dirname "$DIR")
done

# Sai se nao encontrou tsconfig.json
[ -z "$PROJECT_DIR" ] && exit 0

# Roda tsc --noEmit com output limitado
cd "$PROJECT_DIR"
OUTPUT=$(./node_modules/.bin/tsc --noEmit --incremental --pretty 2>&1 | head -30)

if [ $? -ne 0 ]; then
  echo "$OUTPUT" >&2
  exit 0  # exit 0 = nao bloqueia, so mostra o erro
fi

exit 0
