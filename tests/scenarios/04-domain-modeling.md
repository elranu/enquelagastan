# Scenario 04: domain modeling assigns every command to one aggregate

Purpose: prove that the `domain-modeling` skill produces contexts, aggregates with
invariants, entities with domain types, a state machine, and glossary entries, and asks
about overloaded terms.

## Setup

Give a fresh subagent: `skills/domain-modeling/SKILL.md` and its references, a
`01-eventstorming.md` (levels 1 to 3) and the "data, inputs and rules" table of a
`02-wireframes.md`. Include one overloaded term on purpose ("account" as merchant account
and as bank account).

Prompt: "Produce the three levels. Stop at each gate and list the questions you would ask."

## Expected

- Level 1: the overloaded term is raised as a question, not resolved silently; context
  map with labeled directed edges and patterns.
- Level 2: every command and every event in exactly one aggregate; invariants with IDs
  and owners; processes listed separately; numbers with instances and writes per day.
- Level 3: `classDiagram` with stereotypes, references to other aggregates by ID type,
  attributes in domain types; `stateDiagram-v2` with guards named after invariants.
- Glossary entries in the CONTEXT format, with no implementation detail.
- An ADR only if a decision meets the three conditions; otherwise none, and it says so.

## Counter cases

| Change | Expected |
|---|---|
| A command needs two aggregates | The agent splits it or turns it into a process, and asks. |
| The user asks for tables and indexes | The agent defers them to the plan. |

## Result log

| Date | Model | Result | Notes |
|---|---|---|---|
