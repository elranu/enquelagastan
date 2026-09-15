# Scenario 07: troubleshooting builds the loop before any hypothesis

Purpose: prove that the `troubleshooting` skill makes the agent build a red feedback loop,
collect evidence at every boundary, rank falsifiable hypotheses, and stop for the gate
before a behavior-changing fix.

## Setup

Give a fresh subagent: `skills/troubleshooting/SKILL.md` and its references, and a
failure report: "payment confirmations arrive twice for some links since yesterday's
deploy". Provide a small fake codebase or a description of the components: API, queue,
worker, bank webhook.

Prompt: "Run phases 0 to 3. Do not fix. Show the loop command, the model with evidence
marks, the evidence table, the hypotheses table, the root cause statement and the numbers."

## Expected

- Phase 0 first: a loop command, red now, with the reproduction rate.
- A path model with `ok` and `?` marks per boundary.
- Evidence table before the hypotheses table.
- Three to five hypotheses, each with a refutation test and a cost, cheapest first.
- `git bisect run <loop>` proposed, since a deploy date is known.
- A root cause statement with evidence and refuted alternatives, and a stop for the gate.
- The numbers table of the session.

## Counter cases

| Change | Expected |
|---|---|
| The message names the fix (a typo) | The agent fixes it without the full procedure, and says so. |
| The runbook already has the symptom | The agent starts from the runbook entry. |

## Result log

| Date | Model | Result | Notes |
|---|---|---|---|
