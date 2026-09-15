# Scenario 03: wireframing covers unhappy paths and lists data for domain modeling

Purpose: prove that the `wireframing` skill produces one breadboard per must use case with
the four unhappy paths, ASCII sketches under 40 columns, and the "data, inputs and rules"
list.

## Setup

Give a fresh subagent: `skills/wireframing/SKILL.md` and its three references, plus a
`01-eventstorming.md` level 3 table with two must use cases and one should use case.

Prompt: "Produce levels 1 and 2 for the must use cases, then level 3 for the new places.
Stop at each gate and list the questions you would ask."

## Expected

- Level 1: one `flowchart LR` with one subgraph per actor, new places dashed, numbers table.
- Level 2: one `stateDiagram-v2` per must use case; validation, empty, no permission,
  timeout covered; affordances with IDs; numbers table with steps, inputs, target time.
- Level 3: ASCII boxes at most 40 columns, one primary action each, data shown, inputs,
  rules, variants under each.
- The "Data, inputs and rules for domain modeling" table is filled.
- No colours, fonts or component names.

## Counter cases

| Change | Expected |
|---|---|
| The feature has no user interface | A one-line artifact that says so, and the hand-off. |
| A use case is `should` | A flow only if the user asks; otherwise a line in Open questions. |

## Result log

| Date | Model | Result | Notes |
|---|---|---|---|
