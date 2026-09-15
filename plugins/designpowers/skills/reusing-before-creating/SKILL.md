---
name: reusing-before-creating
description: Use before you create a module, a service, a script, a helper, a tool, a dependency, an agent or a skill - during plan writing, implementation, troubleshooting or any task that would add something new to the codebase or to the stack
---

# Reusing before creating

## Overview

The best code is the code that was never written. Ponytail enforces that rule for code:
does it need to exist, is it in the codebase, does the standard library do it, does the
platform do it, does an installed dependency do it, is it one line. This skill widens the
search to what Ponytail does not check: **services, tools, MCP servers, CLIs, skills,
agents and project documents**. And it makes the search visible: every creation carries a
three-line discovery note that says what was searched and why the new thing still exists.

The stage exists because an agent that creates a second queue, a second HTTP client, a
second retry helper or a second script for something a tool already does costs the project
twice: once to write it and forever to keep it.

**REQUIRED BACKGROUND:** designpowers:using-designpowers. Ponytail, when installed, applies
at the same time. Ponytail decides how little to write. This skill decides whether to write
at all.

## When to use

Before any of these appears in a plan, a diff or a stack:

- a module, a package, a class, a helper, a utility, a "common" or "shared" file
- a service, a worker, a queue, a scheduler, a cron, a webhook handler
- a script for a diagnostic, a migration, a data fix, a build step
- a dependency, a CLI tool, an MCP server
- an agent, a skill, a command, a hook

Also before a plan task says "create X". The plan writer runs the gate, not only the
implementer.

## The gate

Run the five searches in order. Stop at the first one that gives a fit. Read what you find
before you decide; a name match is not a fit.

### 1. The codebase

- Grep for the concept: the name, its synonyms, its plural, the verb form. "retry",
  "backoff", "attempt".
- Glob for the shapes where such things live: `*service*`, `*client*`, `*util*`, `*helper*`,
  `*job*`, `*worker*`, `lib/`, `shared/`, `packages/`.
- Look where the closest existing thing lives. A second thing of the same kind goes next to
  the first one, or into it.
- As the lead agent, dispatch `Explore` or `locator` for this search. Do not skip it because
  you "know the codebase".

### 2. Installed dependencies and the platform

- The manifest and the lock file: `package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`.
- The capability inside the dependencies already installed: a date library does parsing, an
  ORM does migrations, a framework does validation.
- The standard library and the platform: the runtime, the database, the hosting platform.
  A cron, a queue, a cache, a file store often exist as a platform feature.

### 3. The session capabilities

- The skills available in this session. A skill that does the task beats a script that
  does it.
- The MCP servers and their tools. Logs, metrics, deployments, databases, tickets often have
  a tool already connected.
- The CLIs on the machine: `which <tool>`. `gh`, `vercel`, `railway`, `supabase`, `psql`.
- The plugin commands installed.

### 4. The project documents

- `CONTEXT.md` and `CONTEXT-MAP.md`: the thing may exist under another name.
- The design spec and `03-domain-model.md`, section "Model for the plan": the module may be
  planned already, with a name.
- `docs/`, ADRs, runbooks: a decision may forbid or prescribe the thing.

### 5. The ecosystem

Only after 1 to 4 fail:

- A maintained library for a generic problem: money, dates, parsing, retries, validation,
  auth. Prefer it over new code.
- Own code for a domain-specific problem. Prefer it over a library that needs bending.
- A platform-native feature over a self-hosted component.

## The decision

In this order of preference:

| Option | When |
|---|---|
| Reuse as is | The existing thing does the job. |
| Extend | The existing thing does most of the job. Add to it, keep one thing. |
| Wrap | The existing thing does the job with the wrong interface. An adapter, no copy. |
| Create | Nothing fits. Then the minimum, per Ponytail. |

Two similar things in the codebase after your change is a failure of this gate, unless an
ADR says why.

**Report what the search surfaces.** When the search finds two or more existing things
that do the same job, report the duplication even though you did not create it. Add one
line to the note: `Duplicates found: <paths>`. The lead decides whether to merge them now
or to open a task.

## The discovery note

Every creation carries this note. Three lines. In the task report of a subagent, in the
plan task that says "create X", in the PR description, in the commit body when there is no
PR.

```
Searched: <paths and patterns>, <dependencies>, <tools and skills>, <documents>
Found: <closest existing thing, with its path>, or none
Decision: reuse | extend | wrap | create, because <one reason>
```

A review that finds a creation without a note sends it back.

## As the lead agent

- The plan writer runs the gate for every task that creates something, and writes the note
  into the task.
- The brief to an implementer names the existing thing to reuse or extend when the gate
  found one. The implementer does not search again for that item.
- Write the brief in the vocabulary of the codebase. Grep the term before you use it. A
  paraphrase ("the fiat provider client") makes the implementer's search miss the real
  name ("the bank provider client, Cresium").
- A subagent report that says "created X" with no note is incomplete. Ask for the note.

## Red flags

| Thought | Reality |
|---|---|
| "It is faster to write it than to search" | The search takes one grep. The duplicate lasts years. |
| "I know this codebase, there is nothing like it" | Grep anyway. Codebases change between sessions. |
| "The existing one is not exactly what I need" | Extend or wrap. Do not copy. |
| "A small helper does not count" | Helpers are where duplicates start. |
| "The plan says create X" | The plan writer ran the gate, or should have. Check for the note. |
| "This script is throwaway" | Check the tools first. A tool call beats a throwaway script. |
