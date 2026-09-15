# En qué la gastan

## Purpose

En qué la gastan makes the public spending of the Argentine national state easy
to read. The data is open already. It comes from an API as thousands of rows
with codes for the jurisdiction, the program and the object of the spending.
This project shows that data as one map. The user sees the total spending as a
pie chart, with the fiscal result beside it. The user taps one slice and goes
one level down: jurisdiction, entity, program, activity, object of the
spending.

The users are the citizens, the journalists and the researchers of Argentina.
The product asks for no login, and for no knowledge of budget terms.

The name of the product is **En qué la gastan**, with the spaces and the
accent. It is a question, and it asks what the politicians do with the money of
their citizens. The name answers the purpose of the product, so it keeps its
exact spelling.

**Where each form goes.** `En qué la gastan` goes everywhere a user reads it:
the title of the site, the copy of the product, the `README.md`, and the title
of every document. `enquelagastan` goes where a user does not read it directly:
the name of the repository, the directory, the URL, the package and the
identifiers. A repository name holds no space and no accent, which is the only
reason the second form exists. See `docs/WRITING_STYLE.md`, "Technical names".

The repository carries the Designpowers stack: design stages between an
approved design spec and the implementation plan, and the `ranu` orchestrator
profile. The design stages record the domain in `CONTEXT.md` and the decisions
under `docs/superpowers/specs/`.

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
enquelagastan/
├── .claude/               # settings, hooks, profile map, the /init skill
├── .claude-plugin/        # marketplace catalog
├── plugins/
│   ├── designpowers/      # the design stages
│   └── ranu/              # the orchestrator profile
├── docs/                  # workflow and writing style
├── scripts/               # setup.sh
├── CONTEXT.md             # glossary of the project
└── README.md
```
