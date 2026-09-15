---
name: eventstorming
description: Use when a design spec is approved on the architectural path of brainstorming, or when the user asks to model a feature or a domain as business events - before wireframes, a domain model or an implementation plan exist
---

# EventStorming

## Overview

EventStorming (Alberto Brandolini) models a domain as the business events that happen in
it, in the order they happen. People, commands, policies and use cases come after the
events, never before. This skill runs the workshop with one agent and one user, in three
levels, and writes `01-eventstorming.md`.

The stage exists to reach shared understanding of **what happens** in the domain before
anybody decides what the screens look like or how the data is stored.

**REQUIRED BACKGROUND:** designpowers:using-designpowers. The level loop applies to every
level below: playback, model, numbers, gate.

## When to use

- `superpowers:brainstorming` ended its architectural path and the user approved the design
  spec. This is the normal entry.
- The user asks to "model the flow", "map the events", "run an EventStorming", or asks what
  happens in a process, step by step.

Do not use it for a bounded change or a spike, for a pure refactor without new behavior,
or when a current `01-eventstorming.md` for the same domain already covers the feature.

## Inputs

Check every input before level 1. Stop and ask when one is missing.

| Input | Where | Required |
|---|---|---|
| Design spec v1, approved | `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md` | Yes |
| Topic slug and date | The design spec file name | Yes |
| Ubiquitous language | `CONTEXT.md` | If it exists |
| Earlier timelines of the same domain | `docs/designpowers/*/01-eventstorming.md` | If they exist. See the incremental rule. |
| Existing behavior in the code | Dispatch `Explore` to search for event names, job names, webhooks, queues, status enums, audit logs | Brownfield only |

Read the design spec in full. Do not start from a summary.

## Output

`docs/designpowers/YYYY-MM-DD-<topic>/01-eventstorming.md`, from
`references/template.md`. Write the artifact after every gate, not at the end. Entries for
`CONTEXT.md`: every event name and every actor name, with a one-sentence definition.

## Core pattern

```
Level 1  Big Picture   events on a timeline            gate
Level 2  Process       actors, commands, policies,     gate
                       read models, external systems
Level 3  Use cases     actor + command = use case      gate  ->  wireframing
```

Each level goes one step deeper only after the user confirms the level above.

## Level 1: Big Picture, the timeline of events

**Rules for an event.** Past tense. Business language. Something a domain expert would say
happened: "Payment link created", "Invoice paid", "Refund rejected". Not a command, not a
screen, not a database row. External systems produce events too when the business sees
them: "Bank transfer confirmed". Failure outcomes are events: "Payment declined", "Link
expired". A hot spot is a question, never an outcome.

**One lane, with branches.** The timeline is one lane per process, left to right. Two
alternative outcomes of the same step ("Card payment confirmed" or "Bank transfer
confirmed") branch and rejoin on the same lane. A second lane means a second process.

**How to elicit.** Three sources, in this order:

1. The design spec. Each goal implies an outcome. Each outcome is an event.
2. The user. Ask "What happens first?", "What happens next?", "What can go wrong here?".
   One question at a time.
3. The code, when it exists. The `Explore` result lists existing events, jobs and statuses.
   Put them on the timeline before the new ones.

**Hot spots.** Where the user hesitates, where two answers conflict, or where the design
spec is silent: mark a hot spot. Do not resolve it alone. A hot spot is a question for the
gate.

**Playback.** Tell the story in at most five sentences: "It starts when ... Then ... It ends
when ...". Use only event names.

**Model.** One Mermaid `flowchart LR`, one lane, events in time order, hot spots attached to
the event where they appear. See `references/legend.md` for the colours and the syntax.

**Numbers.** One table, one row per event:

| Event | Source | Expected frequency | Peak | Business KPI it moves |
|---|---|---|---|---|

Frequency and peak in a unit and a window ("120 per day", "40 per hour on the first of the
month"). When the user has no number, write an estimate and put the literal word
`estimate` in the cell: "150 per day, estimate". Use that exact word: the consolidation
stage counts the cells that carry it. An estimate that the user corrects is a success: it
made the size visible.

Derive downstream numbers as a rate of the upstream event, and write the rate: "opened:
65 percent of sent, estimate". When a number cannot exist until a hot spot is resolved,
write "unknown, blocked on HS-n". That is a valid cell.

**Gate.** Ask, in this order: "Is an event missing?", "Is any of these not a business
fact?", "Is the order right?", then walk through the hot spots. Write the answers into
`Decisions` and `Open questions`. Criterion to pass: the user confirms the sequence, and
every hot spot is resolved or listed as open with an owner. Before the gate the owner
column reads "unassigned"; the gate fills it.

## Level 2: Process, who and what causes the events

For each event, add:

- The **command** that caused it. Imperative: "Create payment link". Blue.
- The **actor** that issued the command. A role, not a person: "Merchant", "Payer",
  "Scheduler". Yellow.
- The **read model** the actor looked at to decide. "Pending invoices list". Green.
- The **policy** that reacts to the event: "Whenever Invoice paid, then Send receipt".
  Purple. A policy issues a command without an actor.
- The **external system** involved. Grey.

Aggregates are not named here. They belong to `designpowers:domain-modeling`.

**Playback.** For the three most important events: "The <actor> sees <read model>, issues
<command>, and <event> happens. Whenever <event>, the system <policy>."

**Model.** The same flowchart, now with the chain actor, command, event, policy, command. One
subgraph per actor keeps it readable. Split into one diagram per process when the timeline
has more than twelve events.

**Numbers.** Two tables:

| Actor | How many | How often they act | Where they act from |
|---|---|---|---|

| Command | Volume | Peak | Must complete in | Policy fired | Sync or async |
|---|---|---|---|---|---|

**Gate.** "Does every event have a cause?", "Is any actor missing?", "Is any policy
automatic today, or does a person do it by hand?". Write decisions and open questions.

## Level 3: Use cases

Rule: one actor plus one command is one use case. A policy that issues a command without an
actor is a system process, not a use case. List both.

| ID | Actor | Command | Reads | Produces | Fires | Hot spots | Priority | Success KPI | Volume |
|---|---|---|---|---|---|---|---|---|---|
| UC-01 | Merchant | Create payment link | Product list | Payment link created | Send link | HS-2 | must | links created per merchant per week | 30/day |

| ID | Policy | Trigger event | Command issued | Priority | KPI |
|---|---|---|---|---|---|
| SP-01 | Send receipt | Invoice paid | Send receipt email | must | receipts sent within 60 s |

Priority uses must, should, could. The success KPI is a number the business would watch
after release, with a unit. Ask the user for the target where one exists.

**Gate.** The user confirms the table and the priorities. This table is the input of
`designpowers:wireframing`. Every `must` use case needs a success KPI before the gate
passes.

## Incremental rule for an existing domain

A full Big Picture runs once per domain. When `01-eventstorming.md` exists for the same
domain, start from its level 1 timeline, add the new events marked with the `new` class,
keep the old ones unchanged, and run the level loop only on the delta. Reference the
earlier artifact in the Context section instead of copying it. On a first run, omit the
`new` class: everything is new.

## Numbers: what counts as a KPI here

- A number with a unit and a time window.
- A baseline when the thing exists today, and a target when the user has one.
- Owned by the business, not by the code: "links paid within 24 h", not "p95 latency".
  Latency belongs to the command table as "must complete in".
- Marked `estimate` when it comes from the agent and not from the user or from data.

## Handoff

Before the hand-off, complete the Handoff section of the artifact:

- [ ] Level 1 timeline confirmed, hot spots resolved or listed.
- [ ] Level 2 actors, commands, policies, read models confirmed.
- [ ] Use case table with IDs, priorities, success KPIs, volumes.
- [ ] System process table.
- [ ] `CONTEXT.md` updated with every event and actor name.
- [ ] Open questions that block wireframing: none.
- [ ] The user approved the artifact.

Ask for permission to commit, as the project rules require. Then:

**REQUIRED SUB-SKILL:** Use designpowers:wireframing

## Common mistakes

| Mistake | Fix |
|---|---|
| "Create order" as an event | Events are past tense: "Order placed". |
| "Row inserted", "API called" | Technical noise. Name the business fact. |
| Naming aggregates or tables in level 1 or 2 | Stage 4. |
| Describing screens | Stage 3. |
| A timeline with no numbers | Not agreed. Add the frequency table. |
| One diagram with everything | Three levels, one diagram per level, split by process when large. |
| Resolving a hot spot alone | A hot spot is a question for the user. |
| Writing the artifact at the end | Write after each gate. Context gets compacted. |
| Redoing the workshop for a feature in a known domain | Incremental rule. Model the delta. |
