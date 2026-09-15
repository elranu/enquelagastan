# Tool map

Which tool answers which question. The defaults below fit a project on this machine:
Claude Code with the browser pane, `gh`, Vercel, Railway, Supabase or Postgres. Each
project copies this table into `docs/troubleshooting.md` and fills the placeholders.

| Question | Tool | How | Notes |
|---|---|---|---|
| What does the user see? | Claude Code browser pane | `run` skill to start the app, then screenshot, console, network | Read the console before the screenshot. |
| What did the request and response carry? | Browser network panel | filter by URL, read the body | Compare with the design spec. |
| What did the local server log? | The dev server output | `preview_logs` when started through the browser pane | |
| What did production log? | Railway MCP | `get-logs`, `get-deployment-diagnosis`, `http-error-rate`, `http-response-time` | Read-only. |
| What did Vercel log? | Vercel CLI | `vercel logs <deployment> > /tmp/out.txt 2>&1`, then read the file | **Fragile pipe.** Never `\| head`, never `\| grep -q`, never cancel while it writes. |
| What did Railway's CLI say? | Railway CLI | same rule: redirect to a file | **Fragile pipe.** |
| Did CI fail, and where? | `gh` | `gh run list --limit 5`, `gh run view <id> --log-failed` | |
| Did a process crash? | `diagnose-crash` skill | core dump analysis | Only for a native crash. |
| What changed? | git | `git log --oneline -20`, `git diff main...HEAD`, `git bisect run <loop>` | Bisect needs the loop from phase 0. |
| Is the database in the state I think? | psql, or the Supabase MCP in read-only | `select ... limit 20` | Never write. Constraints: `pg_constraint`, not `information_schema`. |
| Which test fails and why? | The project test runner | run one test by name, verbose: `<test command> -t "<name>"` | Fill the command per project. |
| Is it the environment? | `vercel env ls`, the platform's variable list | compare names, never values | Never read `.env`. Ask the user. |
| Is the external service up? | curl with timing | `curl -sS -o /dev/null -w "%{http_code} %{time_total}\n" <url>` | Also its status page. |
| Is it a race or a timing issue? | Condition-based waiting | see `superpowers:systematic-debugging` | No sleeps. |
| Does one test pollute another? | `find-polluter.sh` from systematic-debugging | run the suite in isolation and in order | |
| Is it the dependency version? | The lock file | `git log -p -- package-lock.json` around the date | |

## Placeholders every project fills

```
App start command:            <npm run dev | ...>
Test command, one test:       <npx vitest run -t "<name>" | ...>
Test command, full suite:     <...>
Type check:                   <npx tsc --noEmit | ...>
Local log location:           <stdout | file>
Deploy platform and project:  <Vercel <project> | Railway <service>>
Database and how to query:    <psql $DATABASE_URL | Supabase MCP>
CLIs with a fragile pipe:     vercel, railway
```
