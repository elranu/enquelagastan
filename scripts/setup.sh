#!/usr/bin/env bash
#
# One-shot setup for a project that uses the Designpowers template.
#
# `/init` runs this script for you. Run it by hand only when you want the
# plugins without a Claude Code session.
#
# Rules this script follows, and the reason for each:
#
#   - Every command uses `--scope project`, because `.claude/settings.json`
#     enables the plugins at project scope, and Claude Code pairs the two: a
#     plugin enabled at project scope must also be installed at project scope.
#     An install at `local` or `user` scope does not satisfy it, and the plugin
#     reports "enabled in project settings but isn't installed".
#   - The script does not register this repository as a marketplace.
#     `.claude/settings.json` declares it with the relative path `./`, and
#     Claude Code resolves that per project. A `marketplace add` with a path
#     also writes the machine-wide registry, which keeps one directory per
#     marketplace name, so a second clone of this template would take the name
#     `designpowers` away from the first one.
#   - `claude plugin install` rewrites `.claude/settings.json` with its own key
#     order. The content stays the same, so the script restores the committed
#     file when the two are equal as data. It stops and reports when they are
#     not, because then the install changed a value.
#   - Every command tolerates an "already exists" error with `|| true`.
set -euo pipefail

cd "$(dirname "$0")/.."

tracked=".claude/settings.json"
snapshot="$(mktemp)"
trap 'rm -f "$snapshot"' EXIT
cp "$tracked" "$snapshot"

# Register the two external marketplaces. Both point at a GitHub repository, so
# the value is the same for every clone.
claude plugin marketplace add DietrichGebert/ponytail --scope project || true
claude plugin marketplace add wshobson/agents --scope project || true

# Install the plugins that `.claude/settings.json` enables.
claude plugin install superpowers@claude-plugins-official --scope project || true
claude plugin install designpowers@designpowers --scope project || true
claude plugin install ponytail@ponytail --scope project || true
claude plugin install comprehensive-review@claude-code-workflows --scope project || true
claude plugin install incident-response@claude-code-workflows --scope project || true
claude plugin install c4-architecture@claude-code-workflows --scope project || true

# Restore the committed file when the install only reordered the keys.
if ! cmp -s "$tracked" "$snapshot"; then
  if python3 -c "
import json,sys
a=json.load(open('$tracked')); b=json.load(open('$snapshot'))
sys.exit(0 if a==b else 1)
"; then
    cp "$snapshot" "$tracked"
  else
    echo "WARNING: the install changed a value in $tracked, not only the key order."
    echo "Read the diff with 'git diff -- $tracked' before you commit."
  fi
fi

# Report what is installed for this project.
echo
echo "Plugins installed for this project:"
claude plugin list --json 2>/dev/null | python3 -c "
import json,os,sys
try:
    data = json.load(sys.stdin)
except Exception:
    print('  could not read the plugin list'); raise SystemExit(0)
items = data if isinstance(data, list) else data.get('plugins', [])
here = os.getcwd()
want = set(json.load(open('.claude/settings.json'))['enabledPlugins'])
have = {p.get('id') for p in items if p.get('projectPath') == here and p.get('enabled')}
for name in sorted(want):
    print(('  ok      ' if name in have else '  MISSING ') + name)
missing = want - have
if missing:
    print()
    print('  Missing plugins do not load. Run this script again, or install each one with:')
    print('    claude plugin install <name> --scope project')
"
echo
echo "Setup done. Restart the Claude Code session to load the plugins."
