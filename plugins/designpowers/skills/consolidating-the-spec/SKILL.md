---
name: consolidating-the-spec
description: Use when the domain model is confirmed and the design spec must be rewritten with every decision from eventstorming, wireframing and domain modeling, or when one of those artifacts changed after the design spec was consolidated - before writing-plans
---

# Consolidating the design spec

## Overview

The design spec that `superpowers:brainstorming` wrote is version 1: problem, goals, a
first architecture. Three stages later, the real decisions live in three artifacts and in
the conversation. This skill rewrites the design spec as **version 2**: one document with
every decision, every number, and a link to every diagram. `superpowers:writing-plans`
reads that one document.

The design spec is a design doc in the sense of Google's design docs or a Shape Up pitch.
It is not a PRD. It maps to `design.md` in Kiro and Spec Kit; the plan maps to
`tasks.md`.

The stage exists so that **nothing agreed stays only in the conversation**, and so that the
next agent starts from one file.

**REQUIRED BACKGROUND:** designpowers:using-designpowers. This stage has one level, and
the level loop still applies: playback, model, numbers, gate.

## When to use

- `designpowers:domain-modeling` handed off. Normal entry.
- An artifact changed after the design spec was consolidated. Re-run: the spec must match
  the artifacts.
- The user asks to "update the spec", "consolidate", "write the final spec".

Do not use it while a stage still has an open gate. Do not use it to write the plan.

## Inputs

| Input | Where |
|---|---|
| Design spec v1 | `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md` |
| EventStorming | `docs/designpowers/YYYY-MM-DD-<topic>/01-eventstorming.md` |
| Wireframes | `docs/designpowers/YYYY-MM-DD-<topic>/02-wireframes.md` |
| Domain model | `docs/designpowers/YYYY-MM-DD-<topic>/03-domain-model.md` |
| Glossary | `CONTEXT.md` or `CONTEXT-MAP.md` |
| ADRs | `docs/adr/` |

Read every input in full. The Decisions and Open questions tables of each artifact are the
raw material. A stage that was skipped is an input too: its absence goes into the spec.

## Output

The same design spec file, rewritten in place as version 2, from
`references/design-spec-v2-template.md`. Git keeps version 1 in the history. Do not create
a second file: `writing-plans` looks for the design spec.

## Procedure

### 1. Collect the ledger

Build two tables before you write anything:

- **Decision ledger.** Every row of the three Decisions tables, plus every ADR. Deduplicate.
  Keep the source (stage, level, ADR number). A decision that appears only in the
  conversation and in no artifact is a defect of an earlier stage: add it to the artifact
  first, then to the ledger.
- **Question ledger.** Every open question, with its status: resolved (say where),
  deferred (say who owns it and when it is due), blocking. A blocking question stops the
  hand-off.

### 2. Playback

Tell the whole feature to the user in at most ten sentences: the problem, the actors, what
happens, where the user does it, what the model protects, what we decided, what stays
open. This is the macro-level proof of understanding. If the user corrects one sentence,
find the artifact that should have caught it, fix it there, and continue.

### 3. Model: the traceability

One table ties the stages together. Every `must` use case appears once:

| UC | Places (02) | Commands (01) | Aggregate (03) | Invariants (03) | Success KPI (01) |
|---|---|---|---|---|---|

Add a Mermaid `flowchart LR` only when the table has more than eight rows and the user
wants the picture. The table is the model.

### 4. Numbers

Three tables. They tell `writing-plans` how big the work is and tell the business what
"done" means.

**Success KPIs.** From the use cases and the design spec v1 goals:

| KPI | Baseline today | Target | Window | Measured how | Owner |
|---|---|---|---|---|---|

Every KPI needs a measurement point. If nothing measures it today, the plan must add the
instrumentation: write it in the Handoff.

**Size.**

| Use cases must / should / could | Places new / changed | Contexts | Aggregates | Entities and value objects | Invariants | Processes | External systems |
|---|---|---|---|---|---|---|---|

**Volume.**

| Commands per day (sum) | Peak commands per hour | Expected instances per year (largest aggregate) | Numbers confirmed / estimated |
|---|---|---|---|

The last cell counts how many numbers in the three artifacts are confirmed by the user or
by data, against how many are marked `estimate`. A high estimate share is a risk; name it in
the Risks section.

### 5. Write version 2

Fill every section of the template. Rules:

- Diagrams are referenced by file and section, never copied.
- Decisions are written in prose in the section they affect, and listed once in the
  ledger.
- The `Changes from version 1` section lists what modeling changed: scope added, scope
  removed, assumptions of v1 that turned out wrong.
- A skipped stage is stated in `Stages run` with the reason and who asked for it.
- Numbers keep their `estimate` mark.

### 6. Gate

Show the complete version 2 to the user. Ask: "Does this document contain everything we
agreed?", "Is any decision here one you did not make?", "Which open question must be
closed before the plan?". Record the approval line in the header: "Approved by <user> on
<date>". Criterion to pass: the user approves, and the blocking questions list is empty.

## Re-consolidation

When an artifact changes after version 2:

1. Rebuild the decision ledger and diff it against the spec.
2. Update only the affected sections.
3. Bump the version: 2.1, 2.2. Note the change in `Changes from version 1`.
4. Gate again. A re-consolidated spec is not approved until the user says so.

## Handoff

Complete the `Handoff to writing-plans` section:

- [ ] Use cases in priority order, with their KPIs.
- [ ] Modules per aggregate, command handlers, event publishers, processes (from 03).
- [ ] Invariants listed as test targets for TDD.
- [ ] KPIs that need instrumentation, listed as work.
- [ ] Places per use case, with the sketches to build (from 02).
- [ ] Deferred questions with owner and due date.
- [ ] Blocking questions: none.
- [ ] Approved by the user.

Ask for permission to commit, as the project rules require. Then:

**REQUIRED SUB-SKILL:** Use superpowers:writing-plans

Tell writing-plans to read the design spec version 2 first, and the three artifacts for
detail.

## Common mistakes

| Mistake | Fix |
|---|---|
| Copying the diagrams into the spec | Reference them. One source per diagram. |
| A decision that lives only in the chat | Add it to the artifact, then to the ledger. |
| Writing a PRD: goals and stories, no model | The spec carries the model and the numbers. |
| A new file instead of the spec | Rewrite the spec in place. writing-plans reads the spec. |
| Consolidating with a gate still open | Close the gate first. |
| Handing off with a blocking question | Blocking questions stop the hand-off. |
| Dropping the `estimate` marks | Keep them. They are the risk list. |
| A KPI with no measurement point | Add the instrumentation to the Handoff as work. |
