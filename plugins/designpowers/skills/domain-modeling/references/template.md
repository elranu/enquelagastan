# Template: 03-domain-model.md

Copy this skeleton to `docs/designpowers/YYYY-MM-DD-<topic>/03-domain-model.md`. Replace
every `<...>`. Keep every section.

```markdown
# Domain model: <topic>

EventStorming: `docs/designpowers/YYYY-MM-DD-<topic>/01-eventstorming.md`
Wireframes: `docs/designpowers/YYYY-MM-DD-<topic>/02-wireframes.md`
Design spec: `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
Glossary: `CONTEXT.md` (or `CONTEXT-MAP.md`)
Status: level 1 <confirmed/open>, level 2 <confirmed/open>, level 3 <confirmed/open>

## Context

<Two sentences: which contexts this feature touches, which one owns it.>

## Level 1: bounded contexts and context map

### Playback

### Model

```mermaid
flowchart LR
  <contexts, external systems, labeled directed edges>
```

### Numbers

| Context | New or existing | Events owned | Commands owned | Use cases served | External systems |
|---|---|---|---|---|---|

| Relationship | Upstream | Downstream | Pattern | Messages per day | Sync or async |
|---|---|---|---|---|---|

### Overloaded terms resolved

| Term | Meaning in <context A> | Meaning in <context B> | Decision |
|---|---|---|---|

### Gate

## Level 2: aggregates

### Playback

### Model

```mermaid
flowchart LR
  <one subgraph per aggregate, commands in, events out, processes as dotted edges>
```

### Invariants

| ID | Invariant | Aggregate | Enforced on command | Source (screen rule, user, spec) |
|---|---|---|---|---|

### Processes (policies that cross aggregates)

| ID | Trigger event | Command issued | On aggregate | Sync or async | Compensation if it fails |
|---|---|---|---|---|---|

### Numbers

| Aggregate | Commands | Events | Invariants | Expected instances | Writes per day | Peak | Consistency inside | Entities inside |
|---|---|---|---|---|---|---|---|---|

### Gate

## Level 3: entities, value objects, states

### <Aggregate name>

#### Playback

#### Class model

```mermaid
classDiagram
  <root, entities, value objects, references by ID>
```

#### State machine

```mermaid
stateDiagram-v2
  <states from events, transitions from commands, guards named INV-xx>
```

#### Numbers

| Entity or value object | Attributes | Identity | Cardinality to root | Expected count | Lifetime | Personal data |
|---|---|---|---|---|---|---|

<Repeat for every aggregate.>

### Invariant coverage

| Invariant | Enforced by | On command | Violated by which flow if missing |
|---|---|---|---|

### Gate

## Model for the plan

| Aggregate | Module or package | Command handlers | Events published | Processes | Read models served |
|---|---|---|---|---|---|

## Decisions

| # | Decision | Alternatives rejected | Level | ADR | Date |
|---|---|---|---|---|---|

## Open questions

| # | Question | Blocks | Owner | Status |
|---|---|---|---|---|

## Glossary entries added to CONTEXT.md

## Handoff to consolidating-the-spec

- [ ] Context map confirmed
- [ ] Every command and event assigned to one aggregate
- [ ] Invariants with IDs and owners
- [ ] Entities, value objects, attributes complete for every must use case
- [ ] State machines for every root with a status
- [ ] Numbers tables complete, estimates marked
- [ ] CONTEXT.md complete, no implementation detail
- [ ] ADRs written where the three conditions hold
- [ ] "Model for the plan" filled
- [ ] No open question blocks the design spec
- [ ] Artifact approved by the user
```
