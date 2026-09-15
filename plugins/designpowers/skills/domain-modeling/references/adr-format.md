# ADR format

An architecture decision record captures one decision that is hard to reverse, would
surprise a newcomer, and resolved a real trade-off. All three conditions, or no ADR.

File: `docs/adr/NNNN-<slug>.md`, numbered from `0001`. Never edit a decided ADR; write a
new one that supersedes it.

```markdown
# ADR-0003: One aggregate per payment link, payments referenced by ID

Status: proposed | accepted | superseded by ADR-NNNN
Date: 2026-09-11
Deciders: <user>, <agent>
Stage: domain-modeling, level 2

## Context

<Two to four sentences. The situation, the constraint, the invariant at stake. Numbers
when they drove the decision: "30 links per day, up to 40 payments per link".>

## Decision

<One paragraph. What we do. Present tense.>

## Alternatives rejected

| Alternative | Why rejected |
|---|---|
| One aggregate for link and payments | A payment write would lock the link; 40 concurrent payers on one link. |

## Consequences

- <What becomes easier.>
- <What becomes harder.>
- <What must be revisited, and when.>

## Reversal cost

<One sentence: what it takes to undo this. This is why it is an ADR.>
```
