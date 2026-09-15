#!/usr/bin/env node
//
// SubagentStart hook of the designpowers plugin.
//
// It injects the short form of the reuse gate into every subagent, so that an
// implementer searches for what exists before it creates something new. The full
// rule lives in the `reusing-before-creating` skill. This hook injects only its
// `references/gate-summary.md`, which stays under thirty lines on purpose.
//
// Rules this script follows:
//   - It prints one JSON object on stdout and nothing else.
//   - It never fails a subagent. Every error ends the script with no output.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const selfRoot = dirname(dirname(fileURLToPath(import.meta.url)));

try {
  const root = process.env.CLAUDE_PLUGIN_ROOT || selfRoot;
  const gate = readFileSync(
    join(root, 'skills', 'reusing-before-creating', 'references', 'gate-summary.md'),
    'utf8',
  );

  process.stdout.write(
    `${JSON.stringify({
      hookSpecificOutput: { hookEventName: 'SubagentStart', additionalContext: gate },
    })}\n`,
  );
} catch {
  // A missing summary must not stop a subagent.
}

process.exit(0);
