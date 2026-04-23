#!/usr/bin/env node
// PreToolUse (Bash): consolidates three previous hooks into one spawn.
//   1. pre-bash-guard   — block dangerous commands + validate commit messages
//   2. validate-branch  — validate branch naming convention
//   3. aws-profile      — warn when aws CLI lacks --profile in Superlogica repos
//
// Exit 0 = allow, Exit 2 = block with stderr message.

const { spawnSync } = require('child_process');

// ---------- Dangerous command patterns ----------
const DANGEROUS_PATTERNS = [
  'rm -rf /',
  'rm -rf ~',
  'rm -rf .',
  'git push.*--force.*main',
  'git push.*--force.*master',
  'git push.*--force.*develop',
  'git reset --hard',
  'git clean -fd',
  'git checkout -- .',
  'git restore .',
  'git branch -D',
  'DROP TABLE',
  'DROP DATABASE',
  'TRUNCATE',
  'format c:',
  '> /dev/sda',
  'chmod.*777',
  'curl.*\\|.*bash',
  'curl.*\\|.*sh\\b',
  'wget.*\\|.*bash',
  'wget.*\\|.*sh\\b',
  'mkfs',
  'dd if=',
  'npm publish',
  'del /s /q',
  'rd /s /q',
  'rmdir /s /q',
  'reg delete',
  'schtasks /create',
  'wmic process call create',
  'certutil.*-urlcache',
  'git filter-branch',
  'git reflog expire',
];
const DANGEROUS_REGEXES = DANGEROUS_PATTERNS.map((p) => new RegExp(p, 'i'));

// ---------- Conventional commit validation ----------
const VALID_TYPES = ['feat', 'fix', 'chore', 'refactor', 'docs', 'test', 'style', 'perf', 'ci', 'build', 'revert'];
const TYPES_RE = VALID_TYPES.join('|');
const COMMIT_RE = new RegExp(`^(${TYPES_RE})(\\([a-zA-Z0-9_./-]+\\))?!?: .+`);

// ---------- Branch naming ----------
const BRANCH_TYPES = ['feat', 'fix', 'chore', 'refactor', 'docs', 'test', 'perf', 'ci'];
const PROTECTED_BRANCHES = ['main', 'master', 'develop', 'staging', 'HEAD'];
const BRANCH_RE = /^(feat|fix|chore|refactor|docs|test|perf|ci)\/([A-Z]+-\d+-)?[a-z0-9-]+$/;

// ---------- Main ----------
let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  let command;
  try {
    command = JSON.parse(raw).tool_input?.command || '';
  } catch {
    process.exit(0);
  }

  checkDangerous(command);
  validateCommit(command);
  validateBranch(command);
  warnAwsProfile(command);
  process.exit(0);
});

function checkDangerous(command) {
  for (const re of DANGEROUS_REGEXES) {
    if (re.test(command)) {
      fail([
        `BLOCKED: Dangerous command detected: ${re.source}`,
        'Use a safer alternative or ask the user for explicit confirmation.',
      ]);
    }
  }
}

function validateCommit(command) {
  // Only match when `git commit` is the invoked command, not when it appears
  // inside a heredoc/quoted body (e.g. a PR body or doc string).
  if (!/(?:^|[;&|\n]|&&|\|\|)\s*git\s+(?:-C\s+\S+\s+)?commit\b/.test(command)) return;
  if (/--amend/.test(command) && !/-m\s/.test(command)) return;

  const msg = extractCommitMessage(command);
  if (!msg) return;

  const firstLine = msg.split('\n')[0].trim();

  if (/claude code/i.test(firstLine)) {
    fail([
      'Commit message contains "Claude Code".',
      'CLAUDE.md prohibits mentioning Claude Code in commit messages.',
      `Recebido: ${firstLine}`,
    ]);
  }

  if (!COMMIT_RE.test(firstLine)) {
    fail([
      'Commit message fora do padrao conventional commits.',
      '',
      'Formato esperado: type(scope): descricao',
      'Breaking changes: type(scope)!: descricao',
      `Tipos validos: ${VALID_TYPES.join(', ')}`,
      '',
      'Exemplos:',
      '  feat(CC-1234): add gamification scoring',
      '  fix(CC-5678): handle null user in payment',
      '  chore: update dependencies',
      '  feat(CC-1234)!: change API response format',
      '',
      `Mensagem recebida: ${firstLine}`,
    ]);
  }

  const descMatch = firstLine.match(new RegExp(`^(${TYPES_RE})(\\([^)]+\\))?!?: (.+)`));
  if (descMatch) {
    const desc = descMatch[3];
    if (/^[A-Z]/.test(desc)) {
      fail([
        'Descricao do commit deve comecar com letra minuscula.',
        `Recebido: ${firstLine}`,
        `Sugestao: ${firstLine.replace(/: ./, (m) => ': ' + m[2].toLowerCase())}`,
      ]);
    }
  }

  if (firstLine.length > 72) {
    fail([
      `Primeira linha do commit muito longa (${firstLine.length} chars, max 72).`,
      `Recebido: ${firstLine}`,
    ]);
  }

  const repoDir = extractGitCDir(command);
  const gitArgs = repoDir
    ? ['-C', repoDir, 'rev-parse', '--abbrev-ref', 'HEAD']
    : ['rev-parse', '--abbrev-ref', 'HEAD'];
  const result = spawnSync('git', gitArgs, { encoding: 'utf8', timeout: 2000 });
  if (result.status !== 0) return;

  const branch = (result.stdout || '').trim();
  const ticketMatch = branch.match(/[A-Z]+-\d+/);
  if (ticketMatch && !firstLine.includes(ticketMatch[0])) {
    const ticket = ticketMatch[0];
    const suggestion = firstLine.replace(
      new RegExp(`^(${TYPES_RE})(\\([^)]*\\))?(!?:)`),
      `$1(${ticket})$3`,
    );
    fail([
      `A branch '${branch}' referencia o ticket ${ticket}, mas o commit nao.`,
      `Adicione o ticket no scope: type(${ticket}): descricao`,
      '',
      `Recebido: ${firstLine}`,
      `Sugestao: ${suggestion}`,
    ]);
  }
}

function validateBranch(command) {
  const branchName = extractBranchName(command);
  if (!branchName) return;
  if (PROTECTED_BRANCHES.includes(branchName)) return;
  if (BRANCH_RE.test(branchName)) return;

  const suggestions = diagnoseBranchName(branchName);
  fail([
    `Branch name '${branchName}' fora do padrao.`,
    '',
    'Formato esperado:',
    '  type/TICKET-short-description  (com Jira)',
    '  type/short-description         (sem Jira)',
    '',
    `Tipos validos: ${BRANCH_TYPES.join(', ')}`,
    '',
    'Exemplos:',
    '  feat/CC-1234-gamification-scoring',
    '  fix/null-user-payment',
    '  chore/update-dependencies',
    ...suggestions,
  ]);
}

function warnAwsProfile(command) {
  if (!/^\s*aws\s/.test(command)) return;
  if (/--profile/.test(command)) return;
  if (/AWS_PROFILE/.test(command)) return;

  const cwd = process.cwd();
  const superlogicaPaths = ['Superlogica', 'superlogica', 'echo-atende', 'crm-delivery'];
  if (superlogicaPaths.some((p) => cwd.includes(p))) {
    process.stderr.write(
      '[AWS Profile Warning] You are in a Superlogica project but using the default AWS profile.\n' +
        'Add --profile superlogica to your command, or set AWS_PROFILE=superlogica.\n',
    );
  }
}

// ---------- Extraction helpers ----------

function extractCommitMessage(command) {
  const heredocMatch = command.match(/<<'?EOF'?\s*\n([\s\S]*?)\n\s*EOF/);
  if (heredocMatch) return heredocMatch[1].trim();

  const doubleQuoteMatch = command.match(/-m\s+"([^"]+)"/);
  if (doubleQuoteMatch) return doubleQuoteMatch[1];

  const singleQuoteMatch = command.match(/-m\s+'([^']+)'/);
  if (singleQuoteMatch) return singleQuoteMatch[1];

  const catHeredocMatch = command.match(/cat\s+<<'?EOF'?\s*\n([\s\S]*?)\n\s*EOF/);
  if (catHeredocMatch) return catHeredocMatch[1].trim();

  return null;
}

function extractGitCDir(command) {
  const match = command.match(/git\s+-C\s+["']?([^\s"']+)["']?\s/);
  if (!match) return null;
  return match[1].replace(/^\/([a-zA-Z])\//, '$1:/');
}

function extractBranchName(command) {
  // Only match when git is the invoked command (start of line or after a
  // shell separator), not when it appears inside a quoted body.
  const normalized = command.replace(/git\s+-C\s+["']?[^\s"']+["']?\s+/, 'git ');
  const cmdStart = /(?:^|[;&|\n]|&&|\|\|)\s*/;

  const checkoutMatch = normalized.match(new RegExp(cmdStart.source + /git\s+checkout\s+-b\s+["']?([^\s"']+)["']?/.source));
  if (checkoutMatch) return checkoutMatch[1];

  const switchMatch = normalized.match(new RegExp(cmdStart.source + /git\s+switch\s+(?:-c|--create)\s+["']?([^\s"']+)["']?/.source));
  if (switchMatch) return switchMatch[1];

  const branchMatch = normalized.match(new RegExp(cmdStart.source + /git\s+branch\s+(?!-[a-zA-Z]|--[a-z])["']?([^\s"']+)["']?/.source));
  if (branchMatch) return branchMatch[1];

  return null;
}

function diagnoseBranchName(branchName) {
  const lines = [''];
  const slashIdx = branchName.indexOf('/');

  if (slashIdx === -1) {
    const guessedType = guessBranchType(branchName);
    lines.push(`Sugestao: ${guessedType}/${branchName.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`);
    return lines;
  }

  const type = branchName.slice(0, slashIdx);
  const rest = branchName.slice(slashIdx + 1);

  if (!BRANCH_TYPES.includes(type)) {
    const closest = findClosestBranchType(type);
    lines.push(`Tipo '${type}' invalido. Voce quis dizer '${closest}'?`);
    lines.push(`Sugestao: ${closest}/${rest}`);
    return lines;
  }

  if (/[A-Z]/.test(rest) && !/^[A-Z]+-\d+-/.test(rest)) {
    const fixed = rest.replace(/^([A-Z]+-\d+-)/, '$1').toLowerCase().replace(/[^a-z0-9-]/g, '-');
    lines.push('O nome apos o tipo deve ser lowercase (a-z, 0-9, hifens).');
    lines.push(`Sugestao: ${type}/${fixed}`);
  } else if (rest.includes('_') || rest.includes(' ')) {
    const fixed = rest.toLowerCase().replace(/[_ ]+/g, '-').replace(/[^a-z0-9-]/g, '');
    lines.push('Use hifens ao inves de underscores ou espacos.');
    lines.push(`Sugestao: ${type}/${fixed}`);
  } else {
    const fixed = rest.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    lines.push(`Sugestao: ${type}/${fixed}`);
  }

  return lines;
}

function guessBranchType(name) {
  const lower = name.toLowerCase();
  if (lower.includes('fix') || lower.includes('bug')) return 'fix';
  if (lower.includes('feat') || lower.includes('add') || lower.includes('new')) return 'feat';
  if (lower.includes('refactor')) return 'refactor';
  if (lower.includes('doc')) return 'docs';
  if (lower.includes('test')) return 'test';
  if (lower.includes('perf')) return 'perf';
  return 'feat';
}

function findClosestBranchType(input) {
  const lower = input.toLowerCase();
  let best = BRANCH_TYPES[0];
  let bestScore = 0;
  for (const type of BRANCH_TYPES) {
    let score = 0;
    const minLen = Math.min(lower.length, type.length);
    for (let i = 0; i < minLen; i++) {
      if (lower[i] === type[i]) score++;
      else break;
    }
    if (score > bestScore) {
      bestScore = score;
      best = type;
    }
  }
  return best;
}

function fail(lines) {
  process.stderr.write(lines.join('\n') + '\n');
  process.exit(2);
}
