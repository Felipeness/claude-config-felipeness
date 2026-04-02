#!/usr/bin/env node

/**
 * TeammateIdle hook — prevents teammates from going idle while pending tasks exist.
 * Exit code 2 = send feedback to teammate (keeps them working).
 * Exit code 0 = allow idle.
 */

let raw = '';
process.stdin.on('data', chunk => raw += chunk);
process.stdin.on('end', () => {
  let input;
  try { input = JSON.parse(raw); } catch { input = {}; }
  const teammateName = input.teammate_name || 'teammate';
  const pendingTasks = input.pending_tasks || 0;

  if (pendingTasks > 0) {
    process.stdout.write(
      `There are still ${pendingTasks} pending task(s). Pick up the next unassigned task before going idle.`
    );
    process.exit(2);
  }

  process.exit(0);
});
