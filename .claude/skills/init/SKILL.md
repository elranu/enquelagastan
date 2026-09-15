---
name: init
description: Use when the user runs /init in a repository created from the Designpowers template - installs the plugins, turns the template documents into the documents of the new project, and starts the kickoff question that opens the design flow
---

# Init

`/init` is the entry point of a repository created from the Designpowers template. It
does three things in order: it makes the tools work, it makes the documents describe this
project instead of the template, and it asks the one question that starts the design flow.

Do not document the repository before step 3. A repository created from the template has
no project in it yet. There is nothing to document, and the template documents itself.

## Step 1: which repository is this

Read the name of the repository directory.

- The name is `Designpowers`: this is the template itself. Do the normal work of `/init`:
  document the repository as it is. Stop here and do not run the steps below.
- Any other name: this is a new project. Continue.

State which mode you chose in one line, and continue without a question.

## Step 2: make the tools work

Claude Code does not install a plugin on its own. `.claude/settings.json` enables six
plugins at project scope, and each one needs an install at the same scope.

Run `scripts/setup.sh`. It installs the six plugins, restores the tracked settings file
after the CLI reorders it, and prints one line per plugin: `ok` or `MISSING`.

Report the result in one line. On a `MISSING` line, report the plugin and the command the
script printed. Do not continue to step 4 with `superpowers` missing: it owns
`brainstorming`, which is the first stage of the flow.

**A plugin that is installed in this session is not loaded in this session.** Claude Code
reads the plugin list at the start of a session. When the script installed anything, tell
the user: "The plugins are installed. Restart the session, then say `ready` and I start
the kickoff." Then stop. Continue at step 3 when the user comes back.

## Step 3: make the documents describe this project

The root documents came from the template and they describe the template. Correct them.

| File | What to change | What to keep word for word |
|---|---|---|
| `CLAUDE.md` | The title and the `## Purpose` paragraph: name this project and say what it is. The `## Layout` tree: the real tree of this repository. | `## Hard rules`, `## Instruction files for other tools`, `## Working profiles`, `## Design flow` |
| `README.md` | The title, and the paragraph under it. Remove the template sections `Use as a template` and `Add to an existing project`. | `Start the process`, and the flow table |
| `AGENTS.md` | The title only. | Everything else: it is a pointer to `CLAUDE.md`, and it holds the rule that the paths under `.claude/` are literal for every tool |
| `CONTEXT.md` | Nothing yet. The design stages fill it. | The header and the format |

Delete `docs/proposals/`, which holds the design of the template, and
`tests/scenarios/`, which tests the template skills. Keep `docs/WORKFLOW.md` and
`docs/WRITING_STYLE.md`: they describe how you work here.

Do not touch `plugins/`, `.claude/settings.json`, `.claude/hooks/` or
`.claude-plugin/`. They are the stack, and they are the same for every project.

## Step 4: the kickoff

Ask one question and wait:

> What is this project about, and who is it for?

One question, not a list. The answer is the start of `superpowers:brainstorming`, which
asks the rest.

When the user answers, invoke `superpowers:brainstorming` with that answer. Brainstorming
classifies the work. On its architectural path it writes the design spec, and from there
`designpowers:using-designpowers` routes to `designpowers:eventstorming` and the design
flow runs.

Say nothing about the stages before the user answers. The kickoff question is the whole
of step 4.

## Common mistakes

| Mistake | Fix |
|---|---|
| Documenting the repository first | A new project has nothing to document. Step 3 rewrites, step 4 asks. |
| Leaving the template title in a root file | Step 3. A file that says Designpowers in another product is wrong. |
| Asking the kickoff question with `superpowers` missing | Brainstorming does not exist then. Fix step 2 first. |
| Installing the plugins and using them in the same session | Claude Code loads plugins at the start of a session. Ask for a restart. |
| Asking five questions at the kickoff | One question. Brainstorming owns the rest. |
| Rewriting the hard rules or the design flow | They are the stack. Keep them word for word. |
