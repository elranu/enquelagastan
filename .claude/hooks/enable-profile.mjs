#!/usr/bin/env node
//
// Enables the working profile of the current developer in this worktree.
//
// `.claude/settings.local.json` holds the `enabledPlugins` key, and `.gitignore`
// excludes that file. A new worktree therefore starts without it, and the profile
// stays off until somebody writes the key again. This hook writes the key.
//
// The hook reads `.claude/profiles.json`, which maps the email of a
// developer to a profile. It acts only on an exact match. For every other
// developer it does nothing.
//
// Rules this script follows:
//   - It adds one key. It removes nothing, and it changes no other setting. It does
//     rewrite the file with two-space indentation, so the layout can change.
//   - It respects an explicit `false`. A developer who turns a profile off stays off.
//   - It never fails a session. Every error ends the script without a change.
//
// Claude Code reads `enabledPlugins` at the start of a session, so the profile
// loads in the next session, not in the session that writes the key.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// This file sits at <root>/.claude/hooks/, so the root is three levels up. The script
// locates itself instead of trusting the working directory.
const selfRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

try {
  const root = process.env.CLAUDE_PROJECT_DIR || selfRoot;
  const mapPath = join(root, '.claude', 'profiles.json');
  if (!existsSync(mapPath)) process.exit(0);

  const profiles = JSON.parse(readFileSync(mapPath, 'utf8'));

  const email = execFileSync('git', ['config', 'user.email'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();

  const profile = profiles[email];
  if (!profile) process.exit(0);

  const localPath = join(root, '.claude', 'settings.local.json');
  const local = existsSync(localPath) ? JSON.parse(readFileSync(localPath, 'utf8')) : {};

  // An explicit `false` is a decision. Keep it.
  if (local.enabledPlugins && Object.hasOwn(local.enabledPlugins, profile)) process.exit(0);

  local.enabledPlugins = { ...local.enabledPlugins, [profile]: true };
  writeFileSync(localPath, `${JSON.stringify(local, null, 2)}\n`);

  console.log(
    `Enabled the working profile "${profile}" in .claude/settings.local.json. ` +
      'Restart the session to load it.',
  );
} catch {
  // A profile is a convenience. It must never stop a session.
}

process.exit(0);
