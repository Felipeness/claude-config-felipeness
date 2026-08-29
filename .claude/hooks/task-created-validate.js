#!/usr/bin/env node

/**
 * TaskCreated hook — validates tasks have sufficient description before creation.
 * Exit code 2 = reject creation with feedback (stdout).
 * Exit code 0 = allow creation.
 *
 * Claude Code input (stdin JSON):
 *   { task_id, task_subject, task_description, session_id, cwd, ... }
 */

let raw = '';
process.stdin.on('data', chunk => raw += chunk);
process.stdin.on('end', () => {
  let input;
  try { input = JSON.parse(raw); } catch { process.exit(0); return; }

  const title = (input.task_subject || '').trim();
  const desc = (input.task_description || '').trim();

  if (!title || title.length < 5) {
    process.stdout.write('Task title too short (min 5 chars).');
    process.exit(2);
    return;
  }

  if (!desc || desc.length < 20) {
    process.stdout.write('Task description too brief (min 20 chars).');
    process.exit(2);
    return;
  }

  process.exit(0);
});
