# Template: 01-eventstorming.md

Copy this skeleton to `docs/designpowers/YYYY-MM-DD-<topic>/01-eventstorming.md`. Replace
every `<...>`. Keep every section, even when it is short.

```markdown
# EventStorming: <topic>

Design spec: `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md` (v1, approved <date>)
Earlier timelines: <path or "none">
Status: level 1 <confirmed/open>, level 2 <confirmed/open>, level 3 <confirmed/open>

## Context

<Three sentences: the problem from the design spec, the actors, the boundary of this feature.>

## Level 1: timeline of events

### Playback

<At most five sentences. Event names only.>

### Model

```mermaid
flowchart LR
  <events in time order, hot spots attached>
  <legend classDefs>
```

### Numbers

| Event | Source | Expected frequency | Peak | Business KPI it moves |
|---|---|---|---|---|
| Payment link created | Merchant | 150 per day, estimate | 400 per day at month start, estimate | invoiced amount through links |
| Link opened by payer | Payer | 65 percent of sent, estimate | follows sent | payer engagement |
| Payment confirmed | Card processor, bank | 70 percent of submitted, estimate | month end | paid within 24 h: baseline 15 percent, target 60 percent |
| Link expired | Scheduler | unknown, blocked on HS-5 | unknown, blocked on HS-5 | amount lost to expiry |

<Replace the example rows. Keep the literal word `estimate` in every estimated cell.>

### Hot spots

| ID | Question | Raised at | Status | Owner |
|---|---|---|---|---|

### Gate

Confirmed by <user> on <date>. <One line on what changed at the gate.>

## Level 2: actors, commands, policies

### Playback

### Model

```mermaid
flowchart LR
  <actor -> read model -> command -> event -> policy -> command chains>
```

### Numbers

| Actor | How many | How often they act | Where they act from |
|---|---|---|---|

| Command | Volume | Peak | Must complete in | Policy fired | Sync or async |
|---|---|---|---|---|---|

### Gate

## Level 3: use cases

| ID | Actor | Command | Reads | Produces | Fires | Hot spots | Priority | Success KPI | Volume |
|---|---|---|---|---|---|---|---|---|---|

| ID | Policy | Trigger event | Command issued | Priority | KPI |
|---|---|---|---|---|---|

### Gate

## Decisions

| # | Decision | Alternatives rejected | Level | Date |
|---|---|---|---|---|

## Open questions

| # | Question | Blocks | Owner | Status |
|---|---|---|---|---|

## Glossary entries added to CONTEXT.md

<List of event and actor names added.>

## Handoff to wireframing

- [ ] Level 1 confirmed, hot spots resolved or listed
- [ ] Level 2 confirmed
- [ ] Use case table with IDs, priorities, success KPIs, volumes
- [ ] System process table
- [ ] CONTEXT.md updated
- [ ] No open question blocks wireframing
- [ ] Artifact approved by the user
```
