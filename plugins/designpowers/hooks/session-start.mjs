#!/usr/bin/env node
//
// SessionStart hook of the designpowers plugin.
//
// It injects the `using-designpowers` skill into the session as additional context, in
// the same way that Superpowers injects `using-superpowers`. Without this bootstrap the
// skill files are inert: present on disk, never read.
//
// Rules this script follows:
//   - It prints one JSON object on stdout and nothing else.
//   - It never fails a session. Every error ends the script with no output.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const selfRoot = dirname(dirname(fileURLToPath(import.meta.url)));

try {
  const root = process.env.CLAUDE_PLUGIN_ROOT || selfRoot;
  const skill = readFileSync(join(root, 'skills', 'using-designpowers', 'SKILL.md'), 'utf8');

  const context = [
    '<EXTREMELY_IMPORTANT>',
    'This project has Designpowers, a set of design stages that extend Superpowers.',
    'The `using-designpowers` skill below states the routing rule between',
    '`superpowers:brainstorming` and `superpowers:writing-plans`. Follow it.',
    '',
    skill,
    '</EXTREMELY_IMPORTANT>',
  ].join('\n');

  process.stdout.write(
    `${JSON.stringify({
      hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: context },
    })}\n`,
  );
} catch {
  // A missing skill file must not stop a session.
}

process.exit(0);
