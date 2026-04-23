#!/usr/bin/env node
// PostToolUse (Edit|Write): lint edited TS/JS file via biome or eslint.
// Port of lint-after-edit.sh — fixes Windows dirname infinite loop,
// bounds project-root walk, and uses hard timeout.
// Exit 0 always (advisory only — never blocks writes).

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const CODE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const MAX_WALK_DEPTH = 12;
const LINT_TIMEOUT_MS = 3000;

const ESLINT_CONFIG_FILES = [
  '.eslintrc',
  '.eslintrc.js',
  '.eslintrc.cjs',
  '.eslintrc.json',
  '.eslintrc.yml',
  '.eslintrc.yaml',
  'eslint.config.js',
  'eslint.config.mjs',
  'eslint.config.cjs',
  'eslint.config.ts',
];

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  let filePath;
  try {
    filePath = JSON.parse(raw).tool_input?.file_path;
  } catch {
    process.exit(0);
  }
  if (!filePath) process.exit(0);

  const ext = path.extname(filePath).toLowerCase();
  if (!CODE_EXTS.has(ext)) process.exit(0);

  const projectDir = findProjectRoot(path.dirname(filePath));
  if (!projectDir) process.exit(0);

  const linter = detectLinter(projectDir);
  if (!linter) process.exit(0);

  const binName = process.platform === 'win32' ? `${linter.bin}.cmd` : linter.bin;
  const linterBin = path.join(projectDir, 'node_modules', '.bin', binName);
  if (!fs.existsSync(linterBin)) process.exit(0);

  const result = spawnSync(linterBin, [...linter.args, filePath], {
    cwd: projectDir,
    timeout: LINT_TIMEOUT_MS,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });

  if (result.signal === 'SIGTERM' || result.error?.code === 'ETIMEDOUT') {
    process.exit(0);
  }

  if (result.status !== 0) {
    const output = (result.stdout || '') + (result.stderr || '');
    const trimmed = output.split('\n').slice(0, 20).join('\n');
    if (trimmed.trim()) process.stderr.write(trimmed + '\n');
  }
  process.exit(0);
});

function findProjectRoot(startDir) {
  let dir = startDir;
  for (let i = 0; i < MAX_WALK_DEPTH; i++) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
  return null;
}

function detectLinter(projectDir) {
  if (
    fs.existsSync(path.join(projectDir, 'biome.json')) ||
    fs.existsSync(path.join(projectDir, 'biome.jsonc'))
  ) {
    return { bin: 'biome', args: ['check'] };
  }
  for (const cfg of ESLINT_CONFIG_FILES) {
    if (fs.existsSync(path.join(projectDir, cfg))) {
      return { bin: 'eslint', args: ['--no-warn-ignored'] };
    }
  }
  return null;
}
