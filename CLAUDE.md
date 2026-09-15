# Designpowers

## Purpose

Designpowers is a Claude Code plugin repository and a GitHub template. It
extends Superpowers with design stages between brainstorming and
writing-plans. It ships the `ranu` orchestrator profile as a separate plugin.
Use this repository as a template for a new project, or add it as a
marketplace to an existing project. A repository made from the template starts
with `/init`, which installs the plugins, adapts the documents to the new
project and asks the kickoff question. See `.claude/skills/init/SKILL.md`.

## Hard rules

- Do not commit or push without explicit permission from the user.
- Start every session on a fresh branch cut from `main`.
- Write every file in the repository in English. Follow ASD-STE100. See
  `docs/WRITING_STYLE.md`.
- Name every file in kebab-case.

## Instruction files for other tools

`CLAUDE.md` holds the rules. `AGENTS.md` points to this file and holds no rule of its own.

Codex, Cursor and other tools read their own instruction file. An agent that transposes
this file into one of them renames `.claude/` to the name of its own tool, because that
looks correct from the inside. It is wrong. The paths in this file are literal paths on
disk: `.claude/settings.json`, `.claude/hooks/`, `.claude-plugin/` and
`plugins/designpowers/` keep these names for every tool, because Claude Code owns the
plugin format that this repository ships.

So, when you write or update the instruction file of another tool: make it a pointer to
this file, and translate no path. A second copy of the rules also drifts, and the design
flow rule below is the one that must never drift.

## Working profiles

A working profile is opt-in. It holds one output style, one subagent roster,
or both. Enable a profile in `.claude/settings.local.json`, or let
`.claude/hooks/enable-profile.mjs` enable it for you at session start. See
`plugins/ranu/README.md` for the full mechanism.

## Design flow

The `designpowers` plugin adds design stages to Superpowers. This rule overrides the
Superpowers hand-off: after `superpowers:brainstorming` ends its architectural path and
the user approves the design spec, invoke `designpowers:eventstorming`. Do not invoke
`superpowers:writing-plans` at that point. The chain is eventstorming, wireframing,
domain-modeling, consolidating-the-spec, and only then writing-plans.

Every level of every design stage ends with a model, a KPI table, and a user gate. See
`plugins/designpowers/skills/using-designpowers/SKILL.md` and `docs/WORKFLOW.md`.

## Layout

```
Designpowers/
├── .claude/               # settings, hooks, profile map
├── .claude-plugin/        # marketplace catalog
├── plugins/
│   ├── designpowers/      # the methodology plugin
│   └── ranu/              # the orchestrator profile
├── docs/                  # proposals and writing style
├── scripts/               # setup.sh
├── CONTEXT.md             # glossary of the project
└── README.md
```
