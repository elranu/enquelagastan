---
name: using-designpowers
description: Use when starting any conversation in a project that has Designpowers - establishes the design stages between brainstorming and writing-plans, the rule that redirects the brainstorming hand-off, and the level loop that every design stage follows
---

# Using Designpowers

Designpowers adds design stages to Superpowers. Superpowers stays in charge of
brainstorming, writing-plans, execution and TDD. Designpowers owns the space between an
approved design spec and the implementation plan.

**REQUIRED BACKGROUND:** superpowers:using-superpowers. Its rules apply here without change.

## The routing rule

When `superpowers:brainstorming` finishes its architectural path and the user approves the
design spec, do NOT invoke `superpowers:writing-plans`. Invoke `designpowers:eventstorming`.

The design stages run in this order. Each one hands off to the next:

1. `designpowers:eventstorming`
2. `designpowers:wireframing`
3. `designpowers:domain-modeling`
4. `designpowers:consolidating-the-spec`
5. `superpowers:writing-plans`. Only the consolidated design spec v2 reaches this step.

The brainstorming skill ends its architectural path with this sentence: "Invoke the
writing-plans skill to create a detailed implementation plan. Do NOT invoke any other skill.
writing-plans is the next step." In this project that sentence means: "Invoke
designpowers:eventstorming. consolidating-the-spec hands off to writing-plans later."
CLAUDE.md states the same rule, and user instructions take precedence over skills.

Two mechanics make the redirect hold:

- **Recognize the architectural path by its artifact.** Brainstorming wrote a design spec
  file under `docs/superpowers/specs/`. The bounded path and the spike path write no such
  file. If the file exists, the path was architectural.
- **Approval is any affirmative reply** to the request to review the design spec: "approved",
  "ok", "go on", "looks good". Do not wait for a formal sign-off.
- **Rename the todo.** When brainstorming creates the todo "invoke writing-plans skill",
  rename it to "invoke designpowers:eventstorming" at that moment.

## When the stages apply

- Architectural path of brainstorming: all stages, in order.
- Bounded or spike path: no design stage. Follow Superpowers as usual.
- The user asks for one stage by name: run that stage alone. Check its inputs first.
- The user asks to skip one stage: skip it, and record the skip in the design spec v2.
- The user asks to skip all design stages: invoke `superpowers:writing-plans` and add one
  line to the design spec that says the design stages were skipped on the user's request.

## The level loop

Every stage has levels. Every level runs the same loop:

1. **Playback.** Restate what you understood in at most five sentences, in the words of the
   domain. Name the actors, the trigger, the outcome.
2. **Model.** Draw it. Mermaid in a file, ASCII in the conversation.
3. **Numbers.** Put a KPI table next to the model: sizes, frequencies, targets, limits.
4. **Gate.** Ask the user to confirm the level. Write the decisions and the open questions
   into the artifact. Only then go one level down.

Why: the user and the agent understand each other through a model and through numbers. A
model shows the shape. Numbers show the size and the success condition. Together they prove
understanding better than prose does. A level without numbers is not agreed.

## Artifacts

```
docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md     design spec: v1 by brainstorming, v2 by consolidating-the-spec
docs/designpowers/YYYY-MM-DD-<topic>/01-eventstorming.md
docs/designpowers/YYYY-MM-DD-<topic>/02-wireframes.md
docs/designpowers/YYYY-MM-DD-<topic>/03-domain-model.md
CONTEXT.md                                               ubiquitous language of the project
docs/adr/NNNN-<slug>.md                                  decisions that are hard to reverse
```

Use the same date and the same topic slug as the design spec.

## Detail for the next agent

Every artifact ends with a "Handoff" section. It lists what the next stage needs and marks
each item as present. An artifact is complete when the next agent can start without a
question that the artifact should have answered.

## Implementation and troubleshooting

- Before you create a module, a service, a script, a tool, a dependency, an agent or a
  skill: `designpowers:reusing-before-creating`.
- On any failure during implementation: `designpowers:troubleshooting`. It runs on top of
  `superpowers:systematic-debugging`.

## Red flags

| Thought | Reality |
|---|---|
| "The design spec is approved, next is writing-plans" | Not here. Next is eventstorming. |
| "The user knows the domain, skip the playback" | The playback is how you prove that you know it too. |
| "A diagram is enough" | Numbers make the diagram testable. Add the KPI table. |
| "I will write the decisions at the end" | Decisions are written at each gate. Context gets compacted. |
| "The next agent will work it out" | Fill the Handoff section. |
| "This feature is small, skip a level" | Levels are short when the feature is small. They are not optional. |
