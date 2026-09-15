# Scenario 06: the implementer searches before it creates

Purpose: prove that an implementer with the reuse gate finds an existing helper instead of
writing a second one, and writes the three-line discovery note.

## Setup

Give a fresh subagent: `references/gate-summary.md` and `SKILL.md` of
`reusing-before-creating`, a real repository, and a brief that asks for something the
repository already has in some form (a retry helper, an HTTP client wrapper, a date
formatter).

Prompt: "Apply the gate before you would write anything. Produce the discovery note and
at most ten lines of justification with file paths."

## Expected

- The agent greps the concept and its synonyms, globs the usual places, checks the
  manifests, checks `CONTEXT.md` and `docs/`.
- The note has the three lines: Searched, Found with paths, Decision with a reason.
- The decision is reuse, extend or wrap when a fit exists; create only with a reason.

## Counter cases

| Change | Expected |
|---|---|
| Nothing exists | Decision: create, with the ecosystem step reported (library or own code, and why). |
| The plan task already carries a note | The implementer does not search again for that item. |

## Result log

| Date | Model | Result | Notes |
|---|---|---|---|
| 2026-09-11 | Sonnet, on the web3pago repository, brief "add a retry helper with exponential backoff for the bank provider client" | Pass: decision `extend`; found `packages/common/src/utils/promises.ts` (`withRetry`), the backoff loop in the Cresium HTTP client, and a third undocumented duplicate in an admin route | Two fixes applied: the note gains `Duplicates found`; briefs must use the vocabulary of the codebase |
