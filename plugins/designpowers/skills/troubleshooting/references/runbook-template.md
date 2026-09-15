# Template: docs/troubleshooting.md

One file per project. New entries at the top. Every agent reads it before phase 0.

```markdown
# Troubleshooting runbook

## Tool map for this project

| Question | Tool | Command |
|---|---|---|
| App start | | `<command>` |
| One test | | `<command> -t "<name>"` |
| Full suite | | `<command>` |
| Type check | | `<command>` |
| Local logs | | |
| Production logs | | |
| Database, read-only | | |
| CLIs with a fragile pipe | vercel, railway | redirect to a file |

## Entries

### <date>: <symptom in one line>

- **Symptom:** <what the user saw, with the exact message>
- **Loop:** `<the command that is red>`
- **Reproduction rate:** <x of y runs>
- **Root cause:** <one sentence, with the evidence>
- **Refuted:** <hypotheses that were tested and failed>
- **Fix:** <what changed, where, commit>
- **Regression test:** <test name and file>
- **Prevention:** <a monitor, a validation, an invariant, or "none, and why">
- **Numbers:** time to red <m>, boundaries instrumented <n>, hypotheses tested <n>, time to root cause <m>
```
