#!/bin/bash
set -o pipefail
# Hook: PostToolUse (Edit|Write)
# Runs linter on edited TS/JS files after edit
# Detects project linter automatically

INPUT=$(cat)

# Extract file_path from JSON via node
FILE_PATH=$(echo "$INPUT" | node -e "
  let d='';
  process.stdin.on('data',c=>d+=c);
  process.stdin.on('end',()=>{
    try { console.log(JSON.parse(d).tool_input.file_path||''); }
    catch(e) { console.log(''); }
  });
")

# Exit silently if no file_path
[ -z "$FILE_PATH" ] && exit 0

# Only run for TS/JS files
case "$FILE_PATH" in
  *.ts|*.tsx|*.js|*.jsx) ;;
  *) exit 0 ;;
esac

# Find project root (walk up looking for package.json)
DIR=$(dirname "$FILE_PATH")
PROJECT_DIR=""
while [ "$DIR" != "/" ] && [ "$DIR" != "." ]; do
  if [ -f "$DIR/package.json" ]; then
    PROJECT_DIR="$DIR"
    break
  fi
  DIR=$(dirname "$DIR")
done

[ -z "$PROJECT_DIR" ] && exit 0
cd "$PROJECT_DIR"

# Detect linter and run on single file
if [ -f "biome.json" ] || [ -f "biome.jsonc" ]; then
  OUTPUT=$(./node_modules/.bin/biome check "$FILE_PATH" 2>&1 | head -20)
elif [ -f ".eslintrc" ] || [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ] || [ -f ".eslintrc.yml" ] || [ -f "eslint.config.js" ] || [ -f "eslint.config.mjs" ]; then
  OUTPUT=$(./node_modules/.bin/eslint --no-warn-ignored "$FILE_PATH" 2>&1 | head -20)
else
  exit 0
fi

if [ $? -ne 0 ]; then
  echo "$OUTPUT" >&2
fi

exit 0  # Don't block, just show warnings
