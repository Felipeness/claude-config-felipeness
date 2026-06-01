#!/usr/bin/env node

/**
 * Pipeline Precheck Hook — PreToolUse on Skill
 *
 * Hard enforcement: checks prerequisites before allowing execution skills.
 * - Before subagent-driven-development/executing-plans: requires audit + gate
 * - Before brainstorming: reminds about constitution (non-blocking)
 *
 * Exit 0  = allow
 * Exit 2  = block with feedback message
 */

const fs = require('fs');
const path = require('path');

let raw = '';
process.stdin.on('data', (chunk) => (raw += chunk));
process.stdin.on('end', () => {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  const skillName = input.tool_input?.skill || '';
  const cwd = input.cwd || process.cwd();
  const superDir = path.join(cwd, 'docs', 'superpowers');

  // --- Gate: execution skills require audit + phase-gate ---
  const executionSkills = [
    'superpowers:subagent-driven-development',
    'superpowers:executing-plans',
  ];

  if (executionSkills.includes(skillName)) {
    const plansDir = path.join(superDir, 'plans');
    const auditsDir = path.join(superDir, 'audits');
    const gatesDir = path.join(superDir, 'gates');

    // Only enforce if there are plans (otherwise it's a different workflow)
    if (fs.existsSync(plansDir)) {
      const plans = safeReaddir(plansDir).filter((f) => f.endsWith('.md'));
      if (plans.length > 0) {
        const hasAudit =
          fs.existsSync(auditsDir) &&
          safeReaddir(auditsDir).some((f) => f.endsWith('-audit.md'));

        const hasPlanGate =
          fs.existsSync(gatesDir) &&
          safeReaddir(gatesDir).some((f) => f.includes('-plan-gate'));

        const missing = [];
        if (!hasAudit) missing.push('/pre-implementation-audit');
        if (!hasPlanGate) missing.push('/phase-gate (Post-Plan Gate)');

        if (missing.length > 0) {
          process.stdout.write(
            `[Pipeline Precheck] BLOCKED: Cannot start execution without completing:\n` +
              missing.map((m) => `  - ${m}`).join('\n') +
              `\nRun these first, then retry.`
          );
          process.exit(2);
        }
      }
    }

    process.exit(0);
  }

  // --- Gate: brainstorming should check constitution ---
  if (skillName === 'superpowers:brainstorming') {
    if (
      fs.existsSync(superDir) &&
      !fs.existsSync(path.join(superDir, 'constitution.md'))
    ) {
      // If project already has specs or plans, constitution is mandatory (blocking)
      const specsDir = path.join(superDir, 'specs');
      const plansDir = path.join(superDir, 'plans');
      const hasArtifacts =
        (fs.existsSync(specsDir) && safeReaddir(specsDir).some((f) => f.endsWith('.md'))) ||
        (fs.existsSync(plansDir) && safeReaddir(plansDir).some((f) => f.endsWith('.md')));

      if (hasArtifacts) {
        process.stdout.write(
          '[Pipeline Precheck] BLOCKED: Project has existing specs/plans but no constitution.\n' +
            'Run /constitution first to define project principles before brainstorming.\n' +
            'Constitution is required when the project already has design artifacts.'
        );
        process.exit(2);
      }

      // New project (no artifacts yet) — reminder only, non-blocking
      process.stdout.write(
        '[Pipeline Precheck] No project constitution found at docs/superpowers/constitution.md.\n' +
          'Consider running /constitution first to define project principles.\n' +
          'This is recommended but not blocking — you can proceed.'
      );
      process.exit(0);
    }
    process.exit(0);
  }

  // --- Reminder: writing-plans should have spec gate ---
  if (skillName === 'superpowers:writing-plans') {
    const gatesDir = path.join(superDir, 'gates');
    const specsDir = path.join(superDir, 'specs');

    if (fs.existsSync(specsDir)) {
      const specs = safeReaddir(specsDir).filter((f) =>
        f.endsWith('-design.md')
      );
      if (specs.length > 0) {
        const hasSpecGate =
          fs.existsSync(gatesDir) &&
          safeReaddir(gatesDir).some((f) => f.includes('-spec-gate'));

        if (!hasSpecGate) {
          process.stdout.write(
            '[Pipeline Precheck] BLOCKED: Spec exists but no Post-Spec Gate found.\n' +
              'Run /phase-gate first to validate the spec before planning.\n'
          );
          process.exit(2);
        }
      }
    }
    process.exit(0);
  }

  process.exit(0);
});

function safeReaddir(dir) {
  try {
    return fs.readdirSync(dir);
  } catch {
    return [];
  }
}
