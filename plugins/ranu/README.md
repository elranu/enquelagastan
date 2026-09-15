# Working profiles

Each profile plugin lives in `plugins/<name>/` at the repo root. A profile plugin
holds the personal working profile of one developer: an output style, a subagent
roster, or both.

A profile is **opt-in**. The `extraKnownMarketplaces` key in `.claude/settings.json`
registers this catalog for everybody, but registration only makes the profile available.
No profile applies until a developer enables it.

## Enable a profile

Add the profile to `enabledPlugins` in `.claude/settings.local.json`. That file is
personal, and `.gitignore` excludes it, so your choice reaches no other developer:

```json
{
  "enabledPlugins": {
    "ranu@designpowers": true
  }
}
```

Claude Code reads this file at the start of a session. Restart the session after you
change it.

### Automatic activation in a new worktree

`.gitignore` excludes `.claude/settings.local.json`, so a new worktree starts without
it and the profile stays off. The `SessionStart` hook in `.claude/settings.json` solves
this. It runs `.claude/hooks/enable-profile.mjs`, which reads `.claude/profiles.json`:

```json
{
  "your.email@example.com": "your-profile@designpowers"
}
```

The hook compares your `git config user.email` against that map. On an exact match it
adds the key. For every other developer it does nothing.

The hook is deliberately narrow:

- It adds one key. It removes nothing, and it changes no other setting. It does rewrite
  the file with two-space indentation, so the layout of the file can change.
- It respects an explicit `false`. Set the profile to `false` to keep it off for good.
- It never fails a session. Every error ends the script without a change.

The key reaches the file during the session that starts, but Claude Code reads
`enabledPlugins` before that. The profile therefore loads in the next session. The hook
prints a message when it writes the key.

An entry in `.claude/profiles.json` is optional. Without one, enable your profile by
hand.

## Add your own profile

1. Create `plugins/<your-name>/` at the repo root.
2. Add `plugins/<your-name>/.claude-plugin/plugin.json` with the `name`, the
   `description`, and the `version`.
3. Add an `agents/` directory, an `output-styles/` directory, or both.
4. Add an entry for the profile to `.claude-plugin/marketplace.json` at the repo root.
5. Enable it in your own `.claude/settings.local.json`.

An output style with `force-for-plugin: true` applies as soon as the profile is enabled.
Without that field, select the style with the `outputStyle` key.

## What a profile must not do

A profile changes how one developer works. Do not put a project rule in a profile. A rule
that applies to everybody belongs in `CLAUDE.md`, in `.claude/rules/`, or in
`.claude/settings.json`.
