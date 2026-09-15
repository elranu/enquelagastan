---
name: domain-modeling
description: Use when wireframes are confirmed, or when the user asks for the domain model, aggregates, entities, invariants, bounded contexts or a context map - before the design spec is consolidated and before an implementation plan exists
---

# Domain modeling

## Overview

Domain modeling turns the events, commands and screens of the earlier stages into a model
of the domain: bounded contexts, aggregates, entities, value objects, invariants, and the
words that name them. The method is Domain-Driven Design, tactical and strategic, drawn as
Mermaid diagrams in three levels of drill down: macro first, detail last, in the spirit of
the C4 model.

The stage exists to agree on **what the software must protect** (invariants), **where
each rule lives** (aggregates), and **which words mean what** (the ubiquitous language)
before a plan assigns work.

This skill also owns `CONTEXT.md`, the glossary of the project. The glossary discipline
comes from the `domain-modeling` skill by Matt Pocock (MIT): challenge every term that
conflicts, keep the glossary free of implementation detail, update it at once.

**REQUIRED BACKGROUND:** designpowers:using-designpowers. The level loop applies to every
level below: playback, model, numbers, gate.

## When to use

- `designpowers:wireframing` handed off. Normal entry.
- The user asks for the domain model, the aggregates, the entities, the invariants, the
  bounded contexts, a context map, or asks "what is an X here?".

Do not use it to design tables, indexes, APIs or classes in a language. Those belong to
`superpowers:writing-plans` and to the implementation. The model here is independent of
storage.

## Inputs

| Input | Where | What it gives |
|---|---|---|
| Events, commands, policies, actors | `01-eventstorming.md` levels 1 and 2 | Aggregate candidates: an aggregate receives commands and emits events. Policies cross aggregates. |
| Use case table | `01-eventstorming.md` level 3 | Volumes per command, success KPIs |
| Data shown, inputs, rules | `02-wireframes.md`, section "Data, inputs and rules for domain modeling" | Attributes of entities and commands, invariant candidates |
| Design spec v1 | `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md` | Boundaries and constraints |
| Glossary | `CONTEXT.md`, or `CONTEXT-MAP.md` plus one `CONTEXT.md` per context | Existing terms |
| Existing model in the code | Dispatch `Explore` for entities, models, types, schemas, enums, migrations | Brownfield: what exists and what it is called today |

Brownfield option: when the existing system is large and undocumented, run the
`c4-architecture` plugin (claude-code-workflows) first to document what exists, then start
level 1 from its output.

## Output

- `docs/designpowers/YYYY-MM-DD-<topic>/03-domain-model.md`, from `references/template.md`.
- `CONTEXT.md` updated, format in `references/context-format.md`.
- `docs/adr/NNNN-<slug>.md` for a decision that is hard to reverse, surprising, and a real
  trade-off. All three, or no ADR. Format in `references/adr-format.md`.

Write after every gate.

## Core pattern

```
Level 1  Contexts     bounded contexts and the context map          gate
Level 2  Aggregates   one subgraph per aggregate: commands in,      gate
                      events out, invariants
Level 3  Entities     entities, value objects, attributes,          gate  ->  consolidating-the-spec
                      relationships, state machines
```

## Level 1: bounded contexts and the context map

**How to find a context.** Three tests, in this order:

1. **Language.** One word with two meanings marks two contexts. "Account" for a merchant
   and "account" for a bank are not the same thing. Ask the user for every overloaded word.
2. **Events.** Events that always change together belong together. Group the level 1
   timeline of `01-eventstorming.md`.
3. **Teams and deployment.** A different team or a different release cadence marks a
   boundary. In a small project this test often gives one context. That is a valid answer.

External systems are contexts too. Name the relationship with a pattern: customer-supplier,
conformist, anti-corruption layer, open host service with a published language, shared
kernel, separate ways. Say who is upstream.

**Playback.** "This feature lives in <context>. It reads <what> from <context>, which is
upstream. It publishes <events> for <context>." At most five sentences.

**Model.** One Mermaid `flowchart` with one node per context, external systems as nodes,
edges labeled with the pattern and the direction. Use `C4Context` when the user prefers
Simon Brown's notation. Both are in `references/mermaid-c4.md`.

**Numbers.**

| Context | New or existing | Events owned | Commands owned | Use cases served | External systems |
|---|---|---|---|---|---|

| Relationship | Upstream | Downstream | Pattern | Messages per day | Sync or async |
|---|---|---|---|---|---|

**Gate.** "Does any word mean two things across these contexts?", "Is the upstream right?",
"Would a change in <external system> break us, and where do we protect ourselves?".

## Level 2: aggregates

**Rules for an aggregate.**

- It receives commands and emits events. Every command from `01-eventstorming.md` goes
  to exactly one aggregate. Every event comes from exactly one aggregate.
- It protects invariants. An invariant is a rule that must hold after every command.
  Write each one as a sentence with an ID: "INV-01: the total of the payments of a link
  never exceeds its amount."
- It is small. One root, the minimum inside. Other aggregates are referenced by ID, never
  held as objects.
- One command changes one aggregate in one transaction. A policy that touches two
  aggregates is a process, not an aggregate. List processes separately.

**How to find them.** Start from the invariants: the rules from `02-wireframes.md` plus the
ones the user states. Group the commands that must respect the same invariant. That group
is an aggregate. Name it with a noun from the glossary.

**Playback.** "<Aggregate> accepts <commands> and emits <events>. It guarantees <INV-xx>.
It references <other aggregate> by ID."

**Model.** One Mermaid `flowchart` per context, one subgraph per aggregate, commands as
inputs, events as outputs, invariants listed in the subgraph label or beside it. Processes
as separate nodes that connect an event of one aggregate to a command of another.

**Numbers.**

| Aggregate | Commands | Events | Invariants | Expected instances | Writes per day | Peak | Consistency inside | Entities inside |
|---|---|---|---|---|---|---|---|---|

Instances and writes come from the use case volumes. "30 links per day" becomes "about
11,000 links per year". Volumes decide storage and consistency later; write them now.

**Gate.** "Does any command touch two aggregates?" (split it, or make it a process), "Which
invariant needs strong consistency?", "Is any invariant missing that a screen enforces?".

## Level 3: entities, value objects, relationships

For every aggregate:

- **Root entity** with its identity.
- **Entities inside** with identity, **value objects** without identity. Attributes come
  from the "data shown" and "inputs" lists of the wireframes and from the events. Every
  attribute has a type in domain terms: money, date, email, percentage, not `string`.
- **Relationships** with cardinality: one link has zero or more payments.
- **State machine** of the root when it has a status: states from the events of
  `01-eventstorming.md`, transitions labeled with the command.
- **Invariants** attached to the entity or value object that enforces them.

**Playback.** "A <root> has <attributes>. It contains <entities and value objects>. Its
status goes from <state> to <state> when <command>. <INV-xx> is enforced when <command>."

**Model.** One Mermaid `classDiagram` per aggregate with the stereotypes `<<aggregate
root>>`, `<<entity>>`, `<<value object>>`, and one `stateDiagram-v2` per root with a status.
An `erDiagram` is optional and only for the user who thinks in that notation; the model
still describes the domain, not the storage. Syntax in `references/mermaid-class-er.md`.

**Numbers.**

| Entity or value object | Attributes | Identity | Cardinality to root | Expected count | Lifetime | Personal data |
|---|---|---|---|---|---|---|

| Invariant | Enforced by | On command | Violated by which flow if missing |
|---|---|---|---|

**Gate.** "Can any flow in `02-wireframes.md` violate an invariant?", "Is any attribute on a
screen missing here?", "Is any attribute here that no screen and no event needs?".

## The glossary

`CONTEXT.md` holds the ubiquitous language. Rules, applied during every level:

- When the user uses a term that conflicts with the glossary, stop and ask which meaning
  wins. Do not pick one silently.
- When a term is vague ("account", "user", "item"), ask for the precise one.
- One term, one meaning, one context. Overloaded terms split by context.
- The glossary holds terms only. No implementation detail, no field names, no tables.
- Update the glossary at the moment a term is agreed. Never batch.
- Several contexts: `CONTEXT-MAP.md` at the root lists the contexts, one `CONTEXT.md` per
  context directory.

## Architecture decision records

Write an ADR only when a decision is hard to reverse, would surprise a newcomer, and
resolves a real trade-off. All three. Examples: a context split, an eventual-consistency
boundary, a shared kernel with an external system. Format in `references/adr-format.md`.
Number ADRs `0001`, `0002`, in `docs/adr/`.

## Handoff

Complete the Handoff section of the artifact:

- [ ] Context map confirmed, patterns and upstream named.
- [ ] Every command assigned to one aggregate, every event to one aggregate.
- [ ] Invariants listed with IDs, each one enforced by one aggregate.
- [ ] Entities, value objects and attributes complete for every `must` use case.
- [ ] State machines for every root with a status.
- [ ] Numbers tables complete, estimates marked.
- [ ] `CONTEXT.md` complete and free of implementation detail.
- [ ] ADRs written where the three conditions hold.
- [ ] The "Model for the plan" list is filled: modules per aggregate, command handlers,
      event publishers, processes.
- [ ] Open questions that block the design spec: none.
- [ ] The user approved the artifact.

Ask for permission to commit, as the project rules require. Then:

**REQUIRED SUB-SKILL:** Use designpowers:consolidating-the-spec

## Common mistakes

| Mistake | Fix |
|---|---|
| Starting with tables and columns | Start with contexts and invariants. Storage comes with the plan. |
| One aggregate that holds everything | Split by invariant. Reference by ID. |
| An aggregate that holds another aggregate as an object | Reference by ID. |
| Invariants in the head, not in the file | Every invariant has an ID and an owner. |
| Contexts by technical layer (UI, API, DB) | Contexts by language and by events. |
| Attributes typed as `string`, `number` | Domain types: money, email, date, percentage. |
| Glossary with field names or table names | Terms only. |
| Picking a meaning for an overloaded term without asking | Stop and ask. |
| An ADR for every choice | Hard to reverse, surprising, trade-off. All three. |
| No volumes | Instances, writes per day, peak. They decide consistency and storage later. |
