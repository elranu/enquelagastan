# Enquelagastan

A navigable map of the public spending of the Argentine national state. The data is open
already, but it arrives as thousands of rows with codes. This project shows it on one
screen: the total spending as a pie chart, the fiscal result beside it, and a drill down to
the jurisdiction, the entity, the program, the activity and the object of the spending. It
asks for no login, and for no knowledge of budget terms. The users are the citizens, the
journalists and the researchers of Argentina.

The repository carries the Designpowers stack: it extends
[Superpowers](https://github.com/obra/superpowers) with design stages between an approved
design spec and the implementation plan, and the `ranu` lead-orchestrator profile: an
output style and a roster of seven agents.

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
[docs/WORKFLOW.md](docs/WORKFLOW.md).

## What is inside

```
plugins/designpowers/               the design stages
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
.claude-plugin/marketplace.json     marketplace "designpowers": plugins designpowers and ranu
.claude/settings.json               marketplaces, enabled plugins, hooks, permissions
.claude/hooks/enable-profile.mjs    enables the profile of the developer by git email
.claude/skills/init/                the /init that ran once, at the start of this repository
docs/WORKFLOW.md                    the map of the design flow
docs/WRITING_STYLE.md               ASD-STE100 rules for every file in the repo
scripts/setup.sh                    installs the plugins for this repository only
CONTEXT.md                          the glossary of the project
```

Dependencies, installed as plugins and never copied: Superpowers
(`claude-plugins-official`), Ponytail (`DietrichGebert/ponytail`), and three plugins from
`wshobson/agents` (`comprehensive-review`, `incident-response`, `c4-architecture`).

## Start the process

1. **First session.** `/init` ran once here: it installed the six plugins, adapted the
   documents and asked the kickoff question. To install the plugins again on another
   machine, run `scripts/setup.sh` and restart the session. At the start of every session
   two hooks run: Superpowers injects `using-superpowers`, Designpowers injects
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
