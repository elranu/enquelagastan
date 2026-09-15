---
name: wireframing
description: Use when the use case table from eventstorming is confirmed, or when the user asks for wireframes, screens, user flows or a breadboard of a feature - before any visual design, component choice or implementation
---

# Wireframing

## Overview

Low-fidelity wireframes show **where the user is, what the user can do there, and where
each action leads**. Nothing else. No colours, no fonts, no spacing, no component library.
The method is breadboarding from Shape Up (places, affordances, connection lines) with the
"structure first, aesthetics never at this stage" rule of a Design Sprint. The artifacts are
text, disposable, and cheap to redo.

The stage exists to agree on the **user's path** through each use case before anybody
models the data or writes code. Wireframes also reveal what domain modeling needs: the data
each screen shows, the inputs each action collects, and the rules the interface enforces.

**REQUIRED BACKGROUND:** designpowers:using-designpowers. The level loop applies to every
level below: playback, model, numbers, gate.

## When to use

- `designpowers:eventstorming` handed off with a confirmed use case table. Normal entry.
- The user asks for wireframes, screens, a user flow, a breadboard, or "how does the user
  do X".

Do not use it for a feature with no user interface. Say so, write a one-line
`02-wireframes.md` that states "no interface in this feature" with the reason, and hand off.
Do not use it to choose a design system, a component, or a colour.

## Inputs

| Input | Where | Required |
|---|---|---|
| Use case table with priorities and KPIs | `docs/designpowers/YYYY-MM-DD-<topic>/01-eventstorming.md`, level 3 | Yes |
| Actors and read models | Same file, level 2 | Yes |
| Design spec v1 | `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md` | Yes |
| Existing screens, routes, navigation | Dispatch `Explore` to list routes, pages, layouts and navigation entries | Brownfield only |
| Existing component names | The design system or component folder, names only | If it exists |

Read the use case table first. Every `must` use case gets a flow. `should` use cases get a
flow when the user asks. `could` use cases get a line in Open questions.

## Output

`docs/designpowers/YYYY-MM-DD-<topic>/02-wireframes.md`, from `references/template.md`.
Write after every gate.

Formats, fixed:

- Screen map and flows: Mermaid. They render in the file and stay diffable.
- Screen sketches: ASCII, one box per place, at most 40 columns wide. One small box is
  reliable; a whole page of ASCII layout is not.
- In the conversation: ASCII for everything, because the session does not render Mermaid.
- A rendered HTML or SVG wireframe: only when the user asks, with an external wireframe skill.

## Core pattern

```
Level 1  Screen map      every place, per actor, and the navigation        gate
Level 2  Flows           one breadboard per use case, happy and unhappy    gate
Level 3  Sketches        one ASCII box per new or changed place            gate  ->  domain-modeling
```

## Level 1: Screen map, the places

A **place** is anywhere the actor can be: a screen, a modal, a step of a wizard, an email,
a push notification, a printed receipt. See `references/breadboarding.md`.

**How to elicit.** From the use case table: each use case needs at least one place to start
and one place to end. From the code: existing places come first, marked `existing`. From
the user: "Where is the merchant when they decide to do this?".

**Playback.** "The <actor> starts at <place>. To do <UC-xx> they go to <place>. It ends at
<place>." One sentence per `must` use case.

**Model.** One Mermaid `flowchart LR`, one subgraph per actor, nodes are places, edges are
navigation. Mark new places with a dashed border. Entry points (a link in an email, a deep
link, the main menu) are nodes too.

**Numbers.**

| Actor | Places today | Places new | Places changed | Entry points |
|---|---|---|---|---|

| Place | Serves use cases | Expected visits per day | Type (screen, modal, step, email, notification) |
|---|---|---|---|

Derive visits from the use case volumes in `01-eventstorming.md`. Mark estimates.

**Gate.** "Is a place missing?", "Is any place here not needed by a use case?", "Does every
`must` use case have a start and an end?". Write decisions and open questions.

## Level 2: Flows, one breadboard per use case

A breadboard has three elements: **places**, **affordances** (a field, a button, a link, a
toggle: anything the actor can act on) and **connection lines** (an affordance leads to a
place). Each affordance that changes state fires an event from `01-eventstorming.md` level
2. Name it on the line.

**Unhappy paths are part of the flow.** For every use case, cover at least: validation
error, empty state, no permission, timeout or failure of an external system. A flow with
only the happy path fails the gate.

**Playback.** "The <actor> at <place> fills <affordances>, presses <affordance>, which fires
<command> and <event>, and lands on <place>. If <error>, they see <place or state>."

**Model.** One Mermaid `stateDiagram-v2` per use case: states are places, transitions are
`affordance / event`. Use `flowchart TD` with one subgraph per place when the affordances
of a place must be listed. Give every affordance an ID (`A1`, `A2`) that level 3 reuses.

**Numbers.** One row per use case:

| UC | Steps on the happy path | Inputs the actor types | Places touched | Unhappy paths covered | Target time to complete | Target completion rate | Drop-off risk at |
|---|---|---|---|---|---|---|---|

Steps and inputs are counts. Time and completion rate are targets from the user or
estimates. "Drop-off risk at" names the step where the actor would most likely abandon.

**Gate.** "Can the <actor> complete <UC-xx> with these steps?", "At which step would they
abandon?", "Which error did we forget?". Write decisions and open questions.

## Level 3: Sketches, one ASCII box per place

Only for places that are new or change. Use the components in `references/ascii-kit.md`.
Each affordance carries its level 2 ID. Every screen has exactly one primary action.

Under the box, list:

- **Data shown**: which read model, which fields. This is what domain modeling reads.
- **Inputs collected**: every field with its type and whether it is required.
- **Rules the screen enforces**: "amount must be greater than zero", "expiry date in the
  future". These are invariant candidates for domain modeling.
- **Variants**: empty, loading, error, no permission, as a list. A separate box only when
  the structure changes.

**Playback.** "On <place> the <actor> sees <data> and can <affordances>. The primary action
is <A-x>."

**Numbers.** One row per sketched place:

| Place | Fields shown | Inputs | Primary action | Secondary actions | Rules enforced | Variants |
|---|---|---|---|---|---|---|

**Gate.** "Is the primary action obvious?", "Is anything on this screen not needed by the
use case?", "Is a rule missing?". Remove what fails the second question.

## Handoff

Complete the Handoff section of the artifact:

- [ ] Screen map confirmed. New and existing places marked.
- [ ] One flow per `must` use case, unhappy paths covered.
- [ ] One sketch per new or changed place, with data shown, inputs, rules, variants.
- [ ] Numbers tables complete, estimates marked.
- [ ] The list "Data, inputs and rules for domain modeling" is filled.
- [ ] `CONTEXT.md` updated with every new term that appeared on a screen.
- [ ] Open questions that block domain modeling: none.
- [ ] The user approved the artifact.

Ask for permission to commit, as the project rules require. Then:

**REQUIRED SUB-SKILL:** Use designpowers:domain-modeling

## Common mistakes

| Mistake | Fix |
|---|---|
| Choosing colours, fonts, spacing, a component library | Not this stage. Structure and flow only. |
| A screen with a feature that no use case needs | Remove it. Every affordance traces to a use case. |
| Only the happy path | Validation, empty, no permission, timeout. At least these four. |
| One diagram with every flow | One breadboard per use case. |
| An ASCII page layout wider than 40 columns | Split into places, or keep the map in Mermaid. |
| Two primary actions on one screen | Exactly one. |
| Sketching every existing screen again | Only new or changed places. |
| Skipping "data shown, inputs, rules" | That list is the input of domain modeling. |
| No numbers | Steps, inputs, places, error paths, target time. A flow without numbers is not agreed. |
