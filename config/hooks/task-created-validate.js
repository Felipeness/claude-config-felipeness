#!/usr/bin/env node

/**
 * TaskCreated hook — validates tasks have sufficient description before creation.
 * Exit code 2 = reject creation with feedback.
 * Exit code 0 = allow creation.
 */

let raw = '';
process.stdin.on('data', chunk => raw += chunk);
process.stdin.on('end', () => {
  let input;
  try { input = JSON.parse(raw); } catch { input = {}; }
  const title = (input.task_title || '').trim();
  const description = (input.task_description || '').trim();

  if (!title || title.length < 5) {
    process.stdout.write(
      'Task title is too short. Provide a clear, descriptive title (min 5 chars) so teammates understand the scope.'
    );
    process.exit(2);
  }

  if (!description || description.length < 20) {
    process.stdout.write(
      'Task description is too brief. Include: what to do, which files/modules are involved, and acceptance criteria.'
    );
    process.exit(2);
  }

  process.exit(0);
});
