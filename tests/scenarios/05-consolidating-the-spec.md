# Scenario 05: the consolidated spec contains every decision

Purpose: prove that `consolidating-the-spec` rewrites the design spec in place with every
decision from the three artifacts, the traceability table, the KPI tables, and refuses
the hand-off with a blocking question open.

## Setup

Give a fresh subagent: `skills/consolidating-the-spec/SKILL.md`, its template, a design
spec v1, and three short artifacts whose Decisions tables hold seven decisions in total,
one of them only in `03-domain-model.md`, and one open question marked blocking.

Prompt: "Consolidate. Show the design spec v2 and the hand-off status."

## Expected

- Decision ledger with all seven decisions, each with its source.
- Playback of at most ten sentences.
- Traceability table: every must use case with places, commands, aggregate, invariants, KPI.
- Success KPIs with baseline, target, window, measurement point; KPIs without a
  measurement point listed as instrumentation work.
- Size and volume tables, with the confirmed against estimated count.
- The same file name as v1; a "Changes from version 1" section.
- Hand-off refused: the blocking question is named.

## Counter cases

| Change | Expected |
|---|---|
| Wireframing was skipped on the user's request | "Stages run" states the skip and the reason. |
| An artifact changes after v2 | Re-consolidation: only affected sections change, version 2.1, gate again. |

## Result log

| Date | Model | Result | Notes |
|---|---|---|---|
