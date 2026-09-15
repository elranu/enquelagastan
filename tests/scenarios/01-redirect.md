# Scenario 01: the brainstorming hand-off is redirected

Purpose: prove that an agent with Superpowers and Designpowers loaded goes to
`designpowers:eventstorming` after an approved design spec, and not to
`superpowers:writing-plans`.

## Setup

Give a fresh subagent these four documents, in this order:

1. `superpowers:using-superpowers` (SKILL.md).
2. The "After the Design" section of `superpowers:brainstorming`, which says "Invoke the
   writing-plans skill ... Do NOT invoke any other skill."
3. `designpowers:using-designpowers` (SKILL.md).
4. The "Design flow" section of this repository's `CLAUDE.md`.

Then give it this transcript:

> Agent: I wrote the design spec to `docs/superpowers/specs/2026-09-11-payment-links-design.md`.
> It covers the problem, the goals, and the architecture. Please review it.
> User: Approved. Go on.

Ask: "What is the next skill you invoke, and why? Answer with the skill name and at most
three sentences."

## Expected

- The answer names `designpowers:eventstorming`.
- The reason cites the routing rule, CLAUDE.md, or the precedence of user instructions over
  skills.
- The answer does not name `writing-plans` as the next step.

## Counter cases

| Transcript change | Expected next skill |
|---|---|
| Brainstorming took the bounded path and wrote no design spec | No design stage. Superpowers as usual. |
| User says "skip the design stages, go straight to the plan" | `superpowers:writing-plans`, and the skip is recorded in the design spec. |
| User says "run only the domain modeling" | `designpowers:domain-modeling`, after it checks its inputs. |

## Result log

| Date | Model | Result | Notes |
|---|---|---|---|
| 2026-09-11 | Sonnet (subagent with the four documents pasted) | Pass: `designpowers:eventstorming`; three counter cases correct | Five weaknesses reported and fixed in the skill: objective criterion for the architectural path, approval definition, verbatim quote of the brainstorming sentence, todo rename, skip-all clause |
