# Designpowers

A Claude Code plugin repository and a GitHub template. It extends
[Superpowers](https://github.com/obra/superpowers) with design stages between an approved
design spec and the implementation plan, and ships the `ranu` lead-orchestrator profile:
an output style and a roster of seven agents.

The idea: between brainstorming and the implementation plan, the user and the agent must
reach shared understanding. They reach it by **modeling** (diagrams, from macro to micro)
and by **numbers** (a KPI table next to every model), one level at a time, with a human
gate at every level. Every artifact carries enough detail for the next agent.

## The flow

| Stage | Skill | Owner |
|---|---|---|
| 1. Brainstorming | `superpowers:brainstorming` | Superpowers |
| 2. EventStorming: events, actors, commands, use cases | `designpowers:eventstorming` | Designpowers |
| 3. Wireframing: screen map, breadboards, ASCII sketches | `designpowers:wireframing` | Designpowers |
| 4. Domain modeling: contexts, aggregates, entities, invariants, glossary | `designpowers:domain-modeling` | Designpowers |
| 4b. Consolidating the design spec | `designpowers:consolidating-the-spec` | Designpowers |
| 5. Writing the implementation plan | `superpowers:writing-plans` | Superpowers |
| 6. Implementation with TDD | Superpowers execution skills, plus Ponytail | Superpowers |
| Before any creation | `designpowers:reusing-before-creating` | Designpowers |
| On any failure | `designpowers:troubleshooting` on top of `superpowers:systematic-debugging` | Designpowers |

The full map, the level loop, the artifacts and the numbers per stage are in
[docs/WORKFLOW.md](docs/WORKFLOW.md). The design rationale is in
[docs/proposals/2026-09-08-structure-proposal.md](docs/proposals/2026-09-08-structure-proposal.md).

## Status

Version 0.1.0. Every stage skill, the router, the hooks, the agents and the test
scenarios are in place. Three scenarios have a logged pass: 01 redirect, 02 eventstorming
level 1, 06 reuse gate on a real repository. Scenarios 03, 04, 05 and 07 have their setup
and expected results written and wait for their first logged run. The template was
instantiated once (project `dogwalk`); the first field bug, an absolute path written by
`scripts/setup.sh`, is fixed.

## What is inside

```
.claude-plugin/marketplace.json     marketplace "designpowers": plugins designpowers and ranu
plugins/designpowers/               the methodology plugin
  skills/using-designpowers/        router, injected at session start
  skills/eventstorming/
  skills/wireframing/
  skills/domain-modeling/
  skills/consolidating-the-spec/
  skills/reusing-before-creating/   its gate summary is injected into every subagent
  skills/troubleshooting/
  hooks/                            SessionStart and SubagentStart
plugins/ranu/                       the orchestrator profile
  output-styles/lead-orchestrator.md
  agents/                           architect, deep-reviewer, explore, implementer, locator, researcher, troubleshooter
.claude/skills/init/                the /init of a new project: install, adapt, kickoff
.claude/settings.json               marketplaces, enabled plugins, hooks, permissions
.claude/hooks/enable-profile.mjs    enables the profile of the developer by git email
docs/WORKFLOW.md                    the map
docs/WRITING_STYLE.md               ASD-STE100 rules for every file in the repo
tests/scenarios/                    one pressure scenario per skill
scripts/setup.sh                    installs the dependencies for this repository only
CONTEXT.md                          the glossary of the project, empty in the template
```

Dependencies, installed as plugins and never copied: Superpowers
(`claude-plugins-official`), Ponytail (`DietrichGebert/ponytail`), and three plugins from
`wshobson/agents` (`comprehensive-review`, `incident-response`, `c4-architecture`).

## Use as a template

1. On GitHub, choose "Use this template", then clone your new repository.
2. Open Claude Code in it and run:

```bash
/init
```

That is the whole setup. `/init` in a repository made from this template is not the
built-in command: the template ships its own, in `.claude/skills/init/SKILL.md`. It does
three things in order.

| Step | What happens |
|---|---|
| 1. Tools | It runs `scripts/setup.sh`, which installs the six plugins at project scope and prints `ok` or `MISSING` for each one. Claude Code never installs a plugin on its own, and a plugin that is enabled but not installed does not load. |
| 2. Documents | It rewrites the title, the purpose and the layout of `README.md`, `CLAUDE.md` and `AGENTS.md` so they describe your project, and it removes the parts that belong to the template. It keeps the hard rules, the design flow and the pointer rule word for word. |
| 3. Kickoff | It asks one question: what is this project about, and who is it for. Your answer starts `superpowers:brainstorming`, and from there the design flow runs. |

**One restart.** Claude Code reads the plugin list at the start of a session, so plugins
installed during step 1 load in the next session. `/init` tells you when to restart. Say
`ready` when you come back and it continues at step 2.

Afterwards, two optional items:

- Put your git email in `.claude/profiles.json` to enable the `ranu` profile at session
  start, or enable it by hand in `.claude/settings.local.json`. See
  `plugins/ranu/README.md`.
- `npx skills add WH-2099/mermaid-skill` and `npx skills add cheriftj/c4-model-skill`.

If `/init` runs the built-in command instead of this one, invoke the template skill by
name and report it: the precedence of a project skill over a built-in command of the same
name is not documented.

## Add to an existing project

Add to `.claude/settings.json` of that project:

```json
{
  "extraKnownMarketplaces": {
    "designpowers": { "source": { "source": "github", "repo": "elranu/Designpowers" } },
    "ponytail": { "source": { "source": "github", "repo": "DietrichGebert/ponytail" } },
    "claude-code-workflows": { "source": { "source": "github", "repo": "wshobson/agents" } }
  },
  "enabledPlugins": {
    "superpowers@claude-plugins-official": true,
    "designpowers@designpowers": true,
    "ponytail@ponytail": true,
    "comprehensive-review@claude-code-workflows": true,
    "incident-response@claude-code-workflows": true,
    "c4-architecture@claude-code-workflows": true
  }
}
```

Then add the "Design flow" section of this repository's `CLAUDE.md` to that project's
`CLAUDE.md`. The profile plugin `ranu@designpowers` is opt-in per developer.

## Start the process

1. **First session.** In a repository made from the template, run `/init`. It installs
   the plugins, adapts the documents and asks the kickoff question. See "Use as a
   template" above. In a repository where you added Designpowers by hand, run
   `scripts/setup.sh` and restart the session. At the start of the next session two hooks
   run: Superpowers injects `using-superpowers`, Designpowers injects
   `using-designpowers`.
2. **Check.** Type `/plugin` and confirm that `superpowers`, `designpowers`, `ponytail`
   and the three `claude-code-workflows` plugins are enabled. Type `/` and confirm that
   `/designpowers:eventstorming` appears in the list.
3. **Start.** `/init` ends with the kickoff question and starts brainstorming for you.
   Later, for a new feature, say what you want to build: "I want to build X". Superpowers
   makes the agent invoke `brainstorming` first. To start it by hand:

   ```
   /superpowers:brainstorming
   ```

   Brainstorming asks its questions, classifies the work, and on the architectural path
   writes the design spec and asks you to review it. When you approve it, the agent
   invokes `designpowers:eventstorming` on its own. From there each stage hands off to
   the next: wireframing, domain-modeling, consolidating-the-spec, writing-plans.
4. **What you see at every gate.** A playback of at most five sentences, an ASCII model,
   a numbers table, and the questions of the gate. Answer them. The agent writes the
   decisions into the artifact and then goes one level down. Say "approved" to pass a
   gate; correct any sentence, node or number to stop it.
5. **Where things land.**

   ```
   docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md     the design spec, v1 then v2
   docs/designpowers/YYYY-MM-DD-<topic>/01-eventstorming.md
   docs/designpowers/YYYY-MM-DD-<topic>/02-wireframes.md
   docs/designpowers/YYYY-MM-DD-<topic>/03-domain-model.md
   CONTEXT.md                                               the glossary
   docs/superpowers/plans/YYYY-MM-DD-<topic>.md            the implementation plan
   ```

Run one stage alone with its slash command. Each one checks its inputs first:

| Command | When |
|---|---|
| `/designpowers:eventstorming` | model a feature or a domain as events |
| `/designpowers:wireframing` | screens and flows for confirmed use cases |
| `/designpowers:domain-modeling` | contexts, aggregates, entities, glossary |
| `/designpowers:consolidating-the-spec` | rewrite the design spec with every decision |
| `/designpowers:reusing-before-creating` | run the reuse gate before you add something |
| `/designpowers:troubleshooting` | a failure that needs a root cause |
| `/designpowers:using-designpowers` | re-read the routing rule and the level loop |

Small changes and spikes do not enter the design stages. Brainstorming routes them to
implementation as Superpowers does. To skip the design stages for one feature, say so;
the skip is recorded in the design spec.

## Tests

Each file in `tests/scenarios/` describes a pressure test: the documents to give a fresh
subagent, the prompt, the expected behavior, the counter cases and a result log. Run one
by following its setup and record the result in its log.

Validate the manifests with:

```bash
claude plugin validate . && claude plugin validate plugins/designpowers && claude plugin validate plugins/ranu
```

## Credits

- Superpowers, Jesse Vincent: https://github.com/obra/superpowers
- Ponytail, Dietrich Gebert: https://github.com/DietrichGebert/ponytail
- Skills by Matt Pocock (glossary discipline, feedback loop): https://github.com/mattpocock/skills
- Agents and workflows by Seth Hobson: https://github.com/wshobson/agents
- mermaid-skill, WH-2099: https://github.com/WH-2099/mermaid-skill
- c4-model-skill, cheriftj: https://github.com/cheriftj/c4-model-skill
- EventStorming, Alberto Brandolini. Breadboarding, Shape Up (Basecamp). C4 model, Simon Brown.

## License

MIT.
