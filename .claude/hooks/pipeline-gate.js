#!/usr/bin/env node

/**
 * Pipeline Gate Hook — PostToolUse on Write|Edit
 *
 * Detects when spec or plan artifacts are written and injects reminders
 * to run phase-gate, pre-implementation-audit, and constitution checks.
 *
 * Exit 0 = always allow (reminder only, never blocks writes)
 */

let raw = '';
process.stdin.on('data', (chunk) => (raw += chunk));
process.stdin.on('end', () => {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  const filePath = (input.tool_input?.file_path || '').replace(/\\/g, '/');

  // Detect spec artifact write (brainstorming output)
  if (
    filePath.includes('/superpowers/specs/') &&
    filePath.endsWith('-design.md')
  ) {
    process.stdout.write(
      '[Pipeline Gate] Spec artifact written. Before invoking writing-plans you MUST:\n' +
        '1. Check if docs/superpowers/constitution.md exists — if not, run /constitution first\n' +
        '2. Run /phase-gate to validate the spec (Post-Spec Gate)\n' +
        'Only proceed to writing-plans after both gates pass.'
    );
    process.exit(0);
  }

  // Detect plan artifact write (writing-plans output)
  if (
    filePath.includes('/superpowers/plans/') &&
    filePath.endsWith('.md')
  ) {
    process.stdout.write(
      '[Pipeline Gate] Plan artifact written. Before invoking execution (subagent-driven-development or executing-plans) you MUST:\n' +
        '1. Run /pre-implementation-audit to cross-reference spec vs plan\n' +
        '2. Run /phase-gate to validate the plan (Post-Plan Gate)\n' +
        'Only proceed to execution after both gates pass.'
    );
    process.exit(0);
  }

  // Detect constitution write (remind to re-run gates if artifacts exist)
  if (
    filePath.includes('/superpowers/constitution.md')
  ) {
    process.stdout.write(
      '[Pipeline Gate] Constitution updated. If spec or plan already exist, consider re-running /phase-gate to validate against the new constitution.'
    );
    process.exit(0);
  }

  process.exit(0);
});
