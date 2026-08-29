#!/usr/bin/env node
// Bloqueia despacho de subagente "fork" (herda o modelo principal — caro) sem opt-in explicito.
// Escape hatch: incluir a tag [herda-contexto] no prompt do fork libera a chamada.
// Fail-open por design: hook de economia nao pode derrubar despachos legitimos por erro de parse.

let raw = '';
process.stdin.on('data', (chunk) => (raw += chunk));
process.stdin.on('end', () => {
  let toolInput;
  try {
    toolInput = JSON.parse(raw).tool_input ?? {};
  } catch {
    process.exit(0); // stdin invalido: fail-open
  }

  const isFork = toolInput.subagent_type === 'fork';
  const hasOptIn = typeof toolInput.prompt === 'string' && toolInput.prompt.includes('[herda-contexto]');
  if (!isFork || hasOptIn) process.exit(0);

  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason:
          'Fork herda o modelo principal (Fable) e re-le o contexto inteiro da conversa — o despacho mais caro possivel. ' +
          'Despache um agente fresh (general-purpose ou Explore, model sonnet/haiku conforme o roteamento do CLAUDE.md) ' +
          'passando no prompt apenas o contexto necessario. ' +
          'Se herdar o contexto completo for genuinamente indispensavel, re-chame incluindo a tag [herda-contexto] no prompt do fork.',
      },
    }),
  );
  process.exit(0);
});
