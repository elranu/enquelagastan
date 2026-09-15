# En qué la gastan

The instructions for every agent in this repository are in `CLAUDE.md`. Read that file
before you start. It applies to Codex, to Claude Code and to any other agent.

This file holds no rule of its own on purpose. The most important rule of the repository
is the design flow: after `brainstorming` writes a design spec and the user approves it,
the next stage is `eventstorming`, not `writing-plans`. A copy of that rule in a second
file drifts away from the first copy, and an agent that reads the stale copy skips the
design stages without a warning. One file holds the rules.

The paths in `CLAUDE.md` are real paths on disk. `.claude/` is the directory name for
every agent, because Claude Code owns the plugin format that this repository ships. Do
not translate those paths to the name of your own tool.
