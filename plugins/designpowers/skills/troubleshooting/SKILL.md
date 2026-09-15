---
name: troubleshooting
description: Use when a test, a build, a deploy, a command or a feature fails or behaves in an unexpected way, during implementation or in production, before you propose a fix - adds the feedback loop, the tool map, the evidence table and the runbook on top of systematic-debugging
---

# Troubleshooting

## Overview

`superpowers:systematic-debugging` gives the method: no fix without a root cause, four
phases, one variable at a time. This skill gives the **tools and the discipline around
the method**: a feedback loop before any hypothesis, a map of which tool answers which
question in this stack, an evidence table instead of a hunch, numbers for the session, and
a runbook so the next agent does not start from zero.

**REQUIRED BACKGROUND:** superpowers:systematic-debugging. Read it first. Its Iron Law
holds here: no fixes without root cause investigation first.

**REQUIRED BACKGROUND:** designpowers:using-designpowers. The level loop applies: playback,
model, numbers, gate. A root cause is a level; the user confirms it before a fix that
changes behavior.

## When to use

- A test fails and the reason is not obvious from the message.
- A build, a deploy, a migration or a CI run fails.
- A feature does something other than the design spec says.
- A performance regression: slower, more memory, more errors.
- The user says "it broke", "it does not work", "why does it do that".

Do not use it for a failure whose message names the fix: a missing import, a typo, a wrong
path. Fix those. If the same "obvious" fix fails twice, come back here.

## Inputs

| Input | Where |
|---|---|
| The failure as the user saw it: words, screenshot, log line | The conversation |
| The runbook of the project | `docs/troubleshooting.md`, if it exists. Read it first: the failure may be known. |
| The tool map of the project | `docs/troubleshooting.md`, section "Tool map", or `references/tool-map.md` for the defaults |
| What changed | `git log`, `git diff`, the last deploy, the last dependency update |
| The design intent | The design spec, `03-domain-model.md` invariants, `02-wireframes.md` unhappy paths |

## Procedure

### Phase 0: build the feedback loop

Before a single hypothesis, build a check that is **red now and will be green when the
failure is fixed**, that runs in seconds, and that runs with one command. A failing test, a
`curl`, a script, a browser check, a log query. Details and the human-in-the-loop variant
in `references/feedback-loop.md`.

Write the command into the runbook entry at once. A loop that exists only in the
conversation is lost at the next compaction.

Numbers: time to the first red run. Reproduction rate: red in how many of how many runs.
A loop under 100 percent means the failure has a hidden variable; find it before phase 1.

### Phase 1: playback and model

**Playback.** "When <actor> does <action> with <input>, <this> happens instead of <that>.
It started <when>. It happens <always | sometimes | only when>." At most five sentences.

**Model.** Draw the path of the request or the data across components: client, API,
queue, worker, database, external system. ASCII in the conversation. Mark every boundary
where you have evidence and every boundary where you do not.

```
[browser] -> [API /links] -> [queue] -> [worker] -> [bank API]
   ok           ok             ?          ?          timeout?
```

### Phase 2: evidence, then hypotheses

Use `references/tool-map.md`: each question has a tool. Collect at every boundary marked
`?` before you think about causes. Fill the evidence table:

| Boundary | What you observed | Tool | When | Matches expectation |
|---|---|---|---|---|

Then write three to five hypotheses. Each one is falsifiable, has the test that would
refute it, and a cost:

| # | Hypothesis | Refuted by | Cost | Result |
|---|---|---|---|---|

Rank by cost. Test the cheapest first. One variable at a time. When the failure has a time
window, bisect: `git bisect run <the loop command>`.

### Phase 3: root cause and gate

State the root cause in one sentence, with the evidence that proves it and the hypotheses
you refuted. This is the gate: show it to the user before a fix that crosses files, changes
behavior, or touches data. A one-line fix inside the failing function does not need the
gate; say what you did.

### Phase 4: fix at the right seam

- Write the regression test first. It is the feedback loop, promoted to the test suite.
  `superpowers:test-driven-development`.
- Fix where the cause is, not where the symptom shows. A shared function, once; not every
  caller.
- Remove the instrumentation you added.
- Run the loop, then the full suite. `superpowers:verification-before-completion`.

### Phase 5: runbook

Add the entry to `docs/troubleshooting.md` from `references/runbook-template.md`: symptom,
loop command, root cause, fix, prevention. The next agent reads this file first.

## Numbers for the session

| Time to first red loop | Reproduction rate | Boundaries with evidence / total | Hypotheses tested / refuted | Time to root cause | Regression test added | Runbook entry added |
|---|---|---|---|---|---|---|

Write them in the report. They show the user how the conclusion was reached, and over time
they show which failures cost the most.

## Tool rules

- Redirect the output of a CLI to a file and read the file when the CLI is known to abort
  on a closed pipe. Never pipe such a CLI into `head` or `grep -q`. The tool map marks
  them.
- Read-only on production data. A diagnostic query never writes.
- Never read a `.env` file. Ask the user for the variable name and its expected shape.
- Prefer a tool call over a throwaway script. `designpowers:reusing-before-creating`
  applies to diagnostic scripts too.

## Handoff

When the failure was found during a plan task, report to the lead: loop command, evidence
table, root cause, fix and its seam, regression test, runbook entry, the numbers table.
The lead decides whether the plan changes. When the cause is a design defect (an
invariant that the flows can violate, a missing unhappy path), the lead reopens the
artifact that should have caught it, not only the code.

## Common mistakes

| Mistake | Fix |
|---|---|
| A hypothesis before a loop | Phase 0 first. Always. |
| "Let me try this and see" | Every attempt is a hypothesis with a refutation test. Write it. |
| Evidence from one boundary, conclusion about another | Instrument every `?` boundary. |
| A fix at the call site | The seam is where the cause is. |
| Sleeps to "fix" a race | Condition-based waiting. See systematic-debugging. |
| Instrumentation left in the code | Remove it in phase 4. |
| The runbook entry "later" | Phase 5 is part of done. |
| Piping a fragile CLI into `head` | Redirect to a file. |
