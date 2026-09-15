# Template: design spec, version 2

Rewrite `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md` with this structure. Keep
the file name. Replace every `<...>`. Keep every section, even when its content is "none".

```markdown
# <Topic>: design spec

Version: 2, consolidated on <date>. Version 1 by brainstorming on <date> is in the git history.
Stages run: brainstorming, eventstorming, wireframing, domain-modeling. Skipped: <none | stage, reason, requested by>.
Artifacts:
- `docs/designpowers/YYYY-MM-DD-<topic>/01-eventstorming.md`
- `docs/designpowers/YYYY-MM-DD-<topic>/02-wireframes.md`
- `docs/designpowers/YYYY-MM-DD-<topic>/03-domain-model.md`
- `CONTEXT.md`, `docs/adr/<numbers>`
Approved by: <user> on <date>

## Problem and goals

<From version 1, corrected by what modeling found. Three to six sentences.>

## Non-goals and out of scope

- <Item, and why it is out.>

## Actors

| Actor | Who they are | Use cases |
|---|---|---|

## What happens

<The timeline in prose, five to eight sentences, event names from the glossary.>
Diagram: `01-eventstorming.md`, level 1 and 2.

## Use cases

| ID | Actor | Command | Priority | Success KPI | Volume | Places | Aggregate |
|---|---|---|---|---|---|---|---|

Source: `01-eventstorming.md`, level 3. System processes: <list of SP-xx> in the same file.

## Screens and flows

<One paragraph per must use case: where it starts, the steps, where it ends, the unhappy
paths covered.>
Places new: <list>. Places changed: <list>.
Diagrams and sketches: `02-wireframes.md`, levels 1 to 3.

## Domain model

Contexts: <list, with upstream and pattern>.
Aggregates:
- **<Aggregate>**: accepts <commands>, emits <events>, protects <INV-xx: sentence>.
Processes: <list>.
State machines: <root: states>.
Diagrams: `03-domain-model.md`, levels 1 to 3.

## Glossary

Terms introduced or changed by this feature: <list>. Definitions in `CONTEXT.md`.

## Decisions

| # | Decision | Alternatives rejected | Stage and level | ADR |
|---|---|---|---|---|

## Open questions

Blocking: none.

| # | Question | Status (deferred) | Owner | Due |
|---|---|---|---|---|

## Success KPIs

| KPI | Baseline today | Target | Window | Measured how | Owner |
|---|---|---|---|---|---|

KPIs without a measurement point today: <list>. The plan adds the instrumentation.

## Size and volume

| Use cases must / should / could | Places new / changed | Contexts | Aggregates | Entities and value objects | Invariants | Processes | External systems |
|---|---|---|---|---|---|---|---|

| Commands per day (sum) | Peak commands per hour | Expected instances per year (largest aggregate) | Numbers confirmed / estimated |
|---|---|---|---|

## Traceability

| UC | Places | Commands | Aggregate | Invariants | Success KPI |
|---|---|---|---|---|---|

## Risks and assumptions

- <Every number marked estimate, with what happens if it is wrong by 10x.>
- <Every external system we depend on, and the failure path we designed.>

## Changes from version 1

- Added: <scope found during modeling>
- Removed: <scope dropped, and why>
- Corrected: <assumption of v1 that was wrong>

## Handoff to writing-plans

Read this document first, then the three artifacts for detail.

- [ ] Use cases in priority order, with KPIs
- [ ] Modules per aggregate, command handlers, event publishers, processes
- [ ] Invariants as TDD targets: <INV-xx list>
- [ ] KPIs that need instrumentation: <list>
- [ ] Places per use case, sketches to build
- [ ] Deferred questions with owner and due date
- [ ] Blocking questions: none
- [ ] Approved by the user
```
