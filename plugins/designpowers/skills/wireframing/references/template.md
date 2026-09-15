# Template: 02-wireframes.md

Copy this skeleton to `docs/designpowers/YYYY-MM-DD-<topic>/02-wireframes.md`. Replace
every `<...>`. Keep every section.

```markdown
# Wireframes: <topic>

EventStorming: `docs/designpowers/YYYY-MM-DD-<topic>/01-eventstorming.md`
Design spec: `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
Status: level 1 <confirmed/open>, level 2 <confirmed/open>, level 3 <confirmed/open>

## Context

<Two sentences: which actors have an interface in this feature, which use cases get a flow.>

## Level 1: screen map

### Playback

### Model

```mermaid
flowchart LR
  <one subgraph per actor, places as nodes, navigation as edges, new places dashed>
```

### Numbers

| Actor | Places today | Places new | Places changed | Entry points |
|---|---|---|---|---|

| Place | Serves use cases | Expected visits per day | Type |
|---|---|---|---|

### Gate

## Level 2: flows

### UC-01 <name>

#### Playback

#### Breadboard

```
PLACE: <name>
  A1  <affordance>  -> fires <command> -> <event> -> PLACE: <name>
```

```mermaid
stateDiagram-v2
  <places as states, transitions as "affordance / event", unhappy paths included>
```

#### Unhappy paths

| Path | Covered | Lands on |
|---|---|---|
| Validation error | | |
| Empty state | | |
| No permission | | |
| Timeout or external failure | | |

<Repeat for every must use case.>

### Numbers

| UC | Steps on the happy path | Inputs typed | Places touched | Unhappy paths covered | Target time to complete | Target completion rate | Drop-off risk at |
|---|---|---|---|---|---|---|---|

### Gate

## Level 3: sketches

### <Place name> (new | changed)

```
<ASCII box, at most 40 columns>
```

Data shown: <read model and fields>
Inputs collected: <field (type, required?)>
Rules enforced: <rule>
Variants: <empty | loading | error | no permission>

<Repeat for every new or changed place.>

### Numbers

| Place | Fields shown | Inputs | Primary action | Secondary actions | Rules enforced | Variants |
|---|---|---|---|---|---|---|

### Gate

## Data, inputs and rules for domain modeling

| Place | Data shown (read model, fields) | Inputs (command attributes) | Rules (invariant candidates) |
|---|---|---|---|

## Decisions

| # | Decision | Alternatives rejected | Level | Date |
|---|---|---|---|---|

## Open questions

| # | Question | Blocks | Owner | Status |
|---|---|---|---|---|

## Glossary entries added to CONTEXT.md

## Handoff to domain modeling

- [ ] Screen map confirmed, new and existing places marked
- [ ] One flow per must use case, unhappy paths covered
- [ ] One sketch per new or changed place
- [ ] Numbers tables complete, estimates marked
- [ ] "Data, inputs and rules for domain modeling" filled
- [ ] CONTEXT.md updated
- [ ] No open question blocks domain modeling
- [ ] Artifact approved by the user
```
