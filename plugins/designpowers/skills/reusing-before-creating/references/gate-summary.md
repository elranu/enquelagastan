<REUSE_GATE>
Before you create a module, a service, a script, a helper, a tool, a dependency, an agent or a skill, run this gate and stop at the first fit:
1. Codebase: grep the concept and its synonyms; glob *service*, *client*, *util*, *helper*, *job*, shared/, lib/. Read what you find.
2. Installed dependencies, standard library, platform features.
3. Session capabilities: skills, MCP tools, CLIs on the machine, plugin commands.
4. Project documents: CONTEXT.md, the design spec, 03-domain-model.md "Model for the plan", docs/, ADRs.
5. Ecosystem: a maintained library for a generic problem; own code for a domain problem.
Prefer reuse over extend over wrap over create. When you create, write the minimum.
Every creation carries a three-line note in your report:
  Searched: <where>
  Found: <closest existing thing, or none>
  Decision: reuse | extend | wrap | create, because <reason>
When the search finds two or more existing things that do the same job, add a line: Duplicates found: <paths>.
A report that says "created X" without this note is incomplete. Full rule: designpowers:reusing-before-creating.
</REUSE_GATE>
