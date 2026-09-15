# Scenario 02: eventstorming produces level 1 as prescribed

Purpose: prove that an agent with the `eventstorming` skill produces the level 1
deliverable with a playback, a Mermaid model with the legend, a numbers table with
estimates marked, a hot spots table and the gate questions, and stops before level 2.

## Setup

Give a fresh subagent: `skills/eventstorming/SKILL.md`, `references/legend.md`,
`references/template.md`, `skills/using-designpowers/SKILL.md`, and a short greenfield
design spec (payment links: merchant creates a link, payer pays, reconciliation the same
day; a success KPI with a baseline; actors; out of scope).

Prompt: "Produce the level 1 deliverable only, exactly as the skill prescribes. Stop
before level 2. Then list every instruction you found ambiguous or impossible."

## Expected

- Playback: at most five sentences, event names only, past tense.
- Model: `flowchart LR`, events in orange class, hot spots attached with the pink class.
- Numbers: one row per event, frequency and peak with unit and window, estimates marked.
- Hot spots table with IDs.
- Gate questions in the skill's order: missing event, not a business fact, order, then hot spots.
- No actors, commands or aggregates yet.

## Counter cases

| Change | Expected |
|---|---|
| A `01-eventstorming.md` for the same domain exists | The agent applies the incremental rule and models the delta. |
| The spec has no numbers | Every number is an estimate, marked, and the gate asks the user for the real ones. |

## Result log

| Date | Model | Result | Notes |
|---|---|---|---|
| 2026-09-11 | Sonnet, greenfield payment links spec | Pass: four-sentence playback, `flowchart LR` with legend classes and five hot spots, numbers table with estimates marked, hot spots table, gate questions in order, stopped before level 2 | Seven ambiguities reported and fixed: branching outcomes, failure events, literal `estimate`, blocked peaks, owner default, `new` class on first run, worked numbers example |
