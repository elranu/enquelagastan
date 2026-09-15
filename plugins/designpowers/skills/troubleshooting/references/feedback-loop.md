# The feedback loop

A feedback loop is one command that is red now and will be green when the failure is
fixed. It is built before any hypothesis, because every hypothesis is then tested in
seconds instead of minutes, and because it becomes the regression test at the end.

## A good loop

- **One command.** `npx vitest run -t "expires a link"`, `./scripts/repro.sh`, `curl ...`.
- **Red now, green after.** If it is green now, it does not reproduce the failure.
- **Under thirty seconds.** A slow loop makes you skip runs and guess.
- **Deterministic.** Red every time. If it is red only sometimes, the loop is not done:
  there is a hidden variable, usually time, order, or shared state.
- **Written down.** In the runbook entry, at once.

## Kinds of loop, from cheapest to most expensive

| Kind | When | Example |
|---|---|---|
| Unit test | The failure is inside one function or module | one test by name |
| Integration test | The failure crosses modules or hits a database | one test with a seeded database |
| Script | The failure needs a sequence of calls | `curl` chain, or a short script that prints pass or fail |
| Browser check | The failure is what the user sees | `run` the app, drive the browser pane, assert on the page |
| Log query | The failure shows only in production | a filtered log query with a known marker |
| Human in the loop | Only the user can reproduce | see below |

## Human in the loop

When only the user can trigger the failure (a device, an account, a physical card), make
the loop a script that prepares the state, asks the user to act, waits, and checks the
result:

```bash
#!/usr/bin/env bash
# hitl-loop.sh: prepare, ask, check.
set -euo pipefail
<prepare state: seed, reset, start>
echo "Now do: <the action>. Press enter when done."
read -r
<check: query, grep the log, curl>
```

The user acts once per run. Everything else stays automatic.

## Minimize

Once the loop is red, remove inputs until the smallest reproducer remains: fewer records,
fewer steps, one user, one currency. Each removal that keeps the loop red narrows the
cause. Each removal that turns it green points at the cause.

## Promote

The loop becomes the regression test in phase 4. If it was a script, turn it into a test.
If it was a human-in-the-loop script, keep the script in `scripts/` and add the test for
the part that can be automated.
