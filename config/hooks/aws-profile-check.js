#!/usr/bin/env node
// PreToolUse hook: warns when aws CLI used without --profile in Superlogica repos
// Exit 0 = allow (always), but emit warning via stderr

let raw = '';
process.stdin.on('data', chunk => raw += chunk);
process.stdin.on('end', () => {
  try {
    const { tool_input } = JSON.parse(raw);
    const command = tool_input?.command || '';

    // Only check aws commands
    if (!/^\s*aws\s/.test(command)) process.exit(0);

    // Check if already has --profile
    if (/--profile/.test(command)) process.exit(0);

    // Check if AWS_PROFILE is set in the command
    if (/AWS_PROFILE/.test(command)) process.exit(0);

    // Check if we're in a Superlogica directory
    const cwd = process.cwd();
    const superlogicaPaths = ['Superlogica', 'superlogica', 'echo-atende', 'crm-delivery'];
    const inSuperlogica = superlogicaPaths.some(p => cwd.includes(p));

    if (inSuperlogica) {
      process.stderr.write(
        '[AWS Profile Warning] You are in a Superlogica project but using the default AWS profile.\n' +
        'Add --profile superlogica to your command, or set AWS_PROFILE=superlogica.\n'
      );
    }
  } catch {
    // Parse error — allow silently
  }
  process.exit(0);
});
