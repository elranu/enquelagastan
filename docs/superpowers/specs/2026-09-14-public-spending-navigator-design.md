# The public spending navigator: design spec

Version: 2, consolidated on 2026-09-15. Version 1 by brainstorming on 2026-09-14 is in the git history.
Stages run: brainstorming, wireframing, domain-modeling. **Skipped: eventstorming**, because section 8 of version 1 already held the flow of the build, and the user asked to skip it on 2026-09-15. Recover it when the work reaches the alerts.
Artifacts:
- `docs/designpowers/2026-09-14-public-spending-navigator/00-data-sources.md`
- `docs/designpowers/2026-09-14-public-spending-navigator/02-wireframes.md`
- `docs/designpowers/2026-09-14-public-spending-navigator/03-domain-model.md`
- `CONTEXT.md`, `docs/adr/0001-monto-carries-its-exercise.md`
Approved by: Mariano Julio Vicario on 2026-09-15

## Problem and goals

Argentina discusses the spending of the national state every day. The data of that
spending is open, and it is not readable: one exercise is 113,217 rows with 13 levels of
codes. A person who wants to know where the money goes must first learn what a budget
code is.

The goal is one screen that shows the whole spending of the national state, and that goes
down to the object of the spending with a tap. It asks for no login and for no knowledge
of budget terms. It keeps the same URL, and it stays correct: every number it shows equals
the number that the state publishes.

## Non-goals and out of scope

- **A comparison between exercises that removes the inflation.** The user deferred it. ADR
  0001 makes it a small change later.
- **The three other axes of the data**: purpose, source of the money, and place.
- **The alerts on a branch of the tree.** The catalog endpoint of section "Sources" is the
  piece that will serve them.
- **The provinces.**
- **The exercises before 2024.** Pesos of the day across many years mislead until the
  deflator arrives.
- **A treemap.** The measurements rejected it. See "Changes from version 1".
- **Any store of data about the visitor.** The product has no user and no session.

## Actors

| Actor | Who they are | Use cases |
|---|---|---|
| The visitor | A citizen, a journalist or a researcher. The product gives them no role and no login, so they are one actor | UC-01 to UC-08 |

The build is not an actor. It is a process of the context Publicacion.

## What happens

The publisher updates a file in the repository of the DGSIAF. The build sees the new
`Last-Modified`, downloads the ZIP, and adds every row to each of its ancestors to make a
tree of 128,558 nodos. The build then reads the official report of the fiscal result and
compares its own total against it. When the two agree, the build writes the JSON files and
publishes. When they do not agree, the build publishes nothing and the previous version
stays.

The visitor opens the URL and sees the last closed exercise: the total, the part of the
authorized budget that the state executed, the deviation against the budget of the
Congress, a pie chart of the 15 jurisdicciones, and a panel of the fiscal result. The
visitor taps a slice and the pie chart of that slice opens. The visitor goes down to the
object of the spending, and at every screen the foot of the page names the file and the
date that produced the number.

## Use cases

| ID | Actor | Priority | Success KPI | Volume | Places | Aggregate |
|---|---|---|---|---|---|---|
| UC-01 | Visitor | must | Time to the first pie chart under 1.5 s | 100 relative, estimate | P1 | none, read model |
| UC-02 | Visitor | must | Time to go down under 200 ms | 40 to 60 relative, estimate | P1, P2 | none, read model |
| UC-03 | Visitor | must | Time under 200 ms | estimate | P2 | none, read model |
| UC-04 | Visitor | must | Time under 400 ms. The absent path never gives an error | estimate | P1, P2, P2b | none, read model |
| UC-05 | Visitor | must | Time under 200 ms | estimate | P1, P2 | none, read model |
| UC-06 | Visitor | must | **100% of the screens name their source** | every screen | every place | none, read model |
| UC-07 | Visitor | should | Time under 400 ms | 10 to 20 relative, estimate | P3 | none, read model |
| UC-08 | Visitor | should | A shared link opens the same view | estimate | any | none, read model |

**No use case of the visitor issues a command.** The product only reads. The three
commands of this system belong to the build: Construir, Verificar and Publicar.

## Screens and flows

**UC-01.** The visitor arrives at P1 with no action. The screen shows the last closed
exercise. The unhappy path is E1, when the data does not arrive; the screen then shows the
last known data with its date.

**UC-02.** The visitor taps a slice at P1 or P2 and lands at P2. The build already removed
the nodos with one child, so the new place is the first nodo that divides, and the
breadcrumb grows with every name that the build removed. The unhappy path is E4, a nodo
with zero spending.

**UC-03.** The visitor taps the slice "otros", which groups the children below 4%. The new
pie chart shows those children with their part of the total of "otros". A slice "otros"
can hold another one; this happens in 21.2% of the nodos, and only 8 nodos of the tree
need more than 4 openings.

**UC-04.** The visitor taps an arrow. **The exercise changes and the path stays.** When the
path does not exist in the new exercise the visitor lands at P2b, which says so, gives the
value that the nodo had in the exercise of origin, and offers two exits: go up to the
nearest ancestor that exists, or go back. P2b is not a rare screen: below the level of the
programa more than half of the paths of 2025 are absent in 2026.

**UC-05.** The breadcrumb holds every name of the path, and the visitor taps one to land
there.

**UC-06.** The source is a fixed line at the foot of every screen. High in the tree it
names the file and its date of publication. At the lowest nodo of a branch it opens and
shows the codes that identify the rows. Those codes include the segments that the build
removed, because the visitor sees 2 names where the file needs 9 codes.

**UC-07.** The visitor opens the fiscal result at P3, which shows the revenue, the
spending, the result, and the ladder approved, current, executed and paid.

**UC-08.** The URL holds the exercise and the path, so a shared link does not rot.

Places new: P1 Navigator root, P2 Navigator node, P2b Node absent, P3 Fiscal result, P4
Sources and method. Places changed: none, the project is new.
Diagrams and sketches: `02-wireframes.md`, levels 1 to 3.

## Domain model

**Contexts.**

| Context | Position | Pattern |
|---|---|---|
| Presupuesto Abierto | external, upstream | conformist for the codes, translation for the meaning |
| Publicacion | this project | it owns every rule |
| Navegacion | this project | it reads the published files, and it writes nothing |

This project copies the codes of the upstream exactly, because a code that it renames
cannot be checked against the original file. On top of those codes it puts a meaning of
its own: the tree, the slice "otros", the removal of the nodos with one child, and the
deviation.

**Aggregates.**

- **EjercicioPublicado**: accepts Construir, Verificar and Publicar. Emits
  EjercicioSinCambios, EjercicioConstruido, VerificacionFallida and EjercicioPublicado. It
  protects INV-01 to INV-06. It holds the whole exercise, because the build publishes one
  exercise as a whole and there is exactly one writer.

Navegacion has no aggregate. It has a read model with NodoVisible, Porcion, Desviacion and
Procedencia.

**Invariants.**

| ID | Invariant |
|---|---|
| INV-01 | The total devengado of a published exercise equals the official total |
| INV-02 | An exercise reaches the visitor only after a verification that passed |
| INV-03 | A published exercise names its source file and its date of publication |
| INV-04 | The sum of the children of a nodo equals the total of the nodo |
| INV-05 | The identity of a nodo is its full camino, and never its last code |
| INV-06 | `devengado <= vigente` in every nodo of the proyecto level and above |
| INV-07 | The parts that one screen shows add to 100% of the parent, with "otros" |

Processes: none.
State machine: EjercicioPublicado goes SinCambios, or Construido, then Verificado or
Fallido, then Publicado.
Diagrams: `03-domain-model.md`, levels 1 to 3.

## Glossary

Terms introduced by this work: ejercicio, jurisdiccion, entidad, servicio, programa,
subprograma, proyecto, actividad, obra, objeto del gasto, credito presupuestado, credito
vigente, credito comprometido, credito devengado, credito pagado, recurso ingresado
percibido, resultado financiero, nodo, camino, otros, procedencia, monto, nivel de control
presupuestario, reasignacion interna, desviacion, verificacion. Definitions in
`CONTEXT.md`.

The terms of the budget keep their Spanish spelling, because the source data uses those
names.

## Decisions

| # | Decision | Alternatives rejected | Stage and level | ADR |
|---|---|---|---|---|
| C1 | The measure is `credito_devengado` | vigente, pagado, presupuestado, comprometido | brainstorming | - |
| C2 | The exercise on entry is the last closed one | The open exercise | brainstorming | - |
| C3 | Arrows move between exercises, the open exercise at the right | A list, a selector | brainstorming | - |
| C4 | Current pesos, with the part of the total beside it | Constant pesos. Only the part of the total | brainstorming | - |
| C5 | A pie chart at every level | A bar list. A treemap below level 1 | brainstorming, wireframing | - |
| C6 | The children below 4% join one slice "otros" | A cap on the number of slices | brainstorming | - |
| C7 | The slice "otros" opens and gives another pie chart | A list without a chart | brainstorming | - |
| C8 | The build removes the nodos with one child from the path | Show them. 79% of the nodos have one child | brainstorming | - |
| C9 | The axis is institution, and then the object of the spending | The five axes. Purpose in the first version | brainstorming | - |
| C10 | This project computes the fiscal result and verifies it | The undocumented endpoint as a source. The XLSX of Hacienda | brainstorming | - |
| C11 | The source is the bulk files, which need no token | The API with a bearer token. datos.gob.ar. OpenArg | brainstorming | - |
| C12 | The first version holds 2024, 2025 and 2026 | The 32 available exercises | brainstorming | - |
| C13 | Five places | A place for the source | wireframing, 1 | - |
| C14 | The fiscal result gets its own place | A panel inside P1 | wireframing, 1 | - |
| C15 | The source is a fixed line on every screen | A modal that opens | wireframing, 1 | - |
| C16 | The source goes down with the visitor: the file high, the exact codes low | The full path of codes at every level | wireframing, 2 | - |
| C17 | The arrow changes the exercise and nothing else | Go up to the nearest ancestor. Go back to the root | wireframing, 2 | - |
| C18 | An absent path gets its own place with two exits | An error message inside P2 | wireframing, 2 | - |
| C19 | The deviation against the approved budget appears on P1, P2 and P3 | Only on P3. A sentence that interprets it | wireframing, 3 | - |
| C20 | P3 shows approved, current, executed and paid, in that order | Approved against executed only | wireframing, 3 | - |
| C21 | Three contexts, two of this project | One context of this project | domain-modeling, 1 | - |
| C22 | The rule of 4% belongs to Navegacion, and the threshold is a parameter | The build groups the children | domain-modeling, 1 | - |
| C23 | The deviation below the proyecto is shown with its correct name | Hide it. Show it with the same name | domain-modeling, 2 | - |
| C24 | The aggregate holds the whole exercise | One aggregate per nodo | domain-modeling, 2 | - |
| C25 | The build accepts the rows that violate the five rules | Reject the file | domain-modeling, 2 | - |
| C26 | A `Monto` carries the exercise that it belongs to | A plain number. A rule in the documentation | domain-modeling, 3 | **0001** |

## Open questions

**Blocking: none.**

| # | Question | Status | Owner | Due |
|---|---|---|---|---|
| Q1 | Which term of the glossary does `credito_presupuestado` hold? | deferred. Ask `info@presupuestoabierto.gob.ar` | the user | before the first publication |
| Q2 | Is there a rate limit? | deferred. Nothing found. The build makes 3 HEAD per day | the user | before the first publication |
| Q3 | Is the endpoint of the official report stable by intent? | deferred. The second check of the build removes the dependency | the user | before the first publication |
| Q4 | Does the API accept columns that its OpenAPI file does not list? | deferred. The project does not use the API | the user | when the API is needed |
| Q5 | Where does the build run, and where does the site live? | **writing-plans decides it.** GitHub Actions is the candidate. The risk is a scheduled workflow that stops after a repository stays quiet | the agent | writing-plans |
| Q6 | Does the deviation need a colour, or is the sign enough? | deferred. Visual design | the user | implementation |
| Q7 | How does the breadcrumb behave on a telephone when the path is long? | deferred | the user | implementation |
| Q8 | Does P3 list the 15 jurisdicciones, or the first 8 and a group? | deferred | the user | implementation |
| Q9 | Which price index deflates the `Monto`, and which exercise is the base? | deferred. Candidate: the IPC of INDEC. **Unverified, nobody looked for its source** | the user | the inflation button |
| Q10 | Does a closed exercise that changes need to tell the visitor? | deferred. It belongs to the alerts | the user | the alerts |
| Q11 | **What does success look like outside the product?** Visits, shares, citations in the press. Nobody set a target | open. See "Success KPIs" | the user | before the launch |

## Success KPIs

| KPI | Baseline today | Target | Window | Measured how | Owner |
|---|---|---|---|---|---|
| The published total equals the official total | none, the product does not exist | difference 0 | every build | the build itself, INV-01 | the build |
| The site holds the newest published file | none | within 24 h of the publication | every day | compare the date of the build with the `Last-Modified` of the source | needs instrumentation |
| Time to the first pie chart | none | under 1.5 s | every visit | a real measurement in the browser | needs instrumentation |
| Time to go one level down | none | under 200 ms | every visit | a real measurement in the browser | needs instrumentation |
| Screens that name their source | none | 100% | every release | a test over the built files | needs instrumentation |
| A build that does not verify never publishes | none | 100% | every build | a test that makes the verification fail | needs instrumentation |

KPIs without a measurement point today: every row except the first. The plan adds the
instrumentation.

**The product has no KPI of outcome.** Nobody set a target for visits, for shares or for
citations in the press. Question Q11 holds it, and the user owns it. This spec does not
invent one, because an invented target for a product that does not exist would give a
false measure of success.

## Size and volume

| Use cases must / should / could | Places new / changed | Contexts | Aggregates | Entities and value objects | Invariants | Processes | External systems |
|---|---|---|---|---|---|---|---|
| 6 / 2 / 0 | 5 / 0 | 3 | 1 | 9 | 7 | 0 | 2 |

| Commands per day | Peak commands per hour | Instances per year, largest aggregate | Numbers confirmed / estimated |
|---|---|---|---|
| 3 to 9 | 9 | 385,674 nodos over 3 exercises, rebuilt up to 365 times for the open one | about 45 confirmed / about 29 estimated |

**Every number about the data is measured. Every number about the behaviour of a visitor
is an estimate.** The product does not exist, so no visit, no time and no rate of
completion has a baseline. The counts above follow that line.

## Traceability

| UC | Places | Commands | Aggregate | Invariants | Success KPI |
|---|---|---|---|---|---|
| UC-01 | P1 | none | none, read model | INV-04, INV-07 | first pie chart under 1.5 s |
| UC-02 | P1, P2 | none | none, read model | INV-04, INV-05, INV-07 | under 200 ms |
| UC-03 | P2 | none | none, read model | INV-07 | under 200 ms |
| UC-04 | P1, P2, P2b | none | none, read model | INV-05 | under 400 ms, no error |
| UC-05 | P1, P2 | none | none, read model | INV-05 | under 200 ms |
| UC-06 | every place | none | none, read model | INV-03, INV-05 | 100% of the screens |
| UC-07 | P3 | none | none, read model | INV-01, INV-06 | under 400 ms |
| UC-08 | any | none | none, read model | - | the link opens the same view |
| build | none | Construir, Verificar, Publicar | EjercicioPublicado | INV-01 to INV-06 | difference 0 |

## Risks and assumptions

- **The endpoint of the official report is not in any public contract.** It answers today
  and it needs no token, and it can stop without a notice. The build has a second check
  that compares the new total with the total of the last build, so the product does not
  depend on it.
- **The bulk repository can move.** The build then gives 404, publishes nothing, and
  reports. The previous version stays.
- **Every number about a visitor is an estimate.** If the traffic is 10 times higher than
  any guess, nothing in this design changes: the files are static and a CDN serves them.
  If the target times are wrong by 10 times, the design is wrong, so the plan must measure
  them on a real build and not trust the estimate.
- **The cadence of the publisher is unknown.** The design does not depend on it, because
  the build reads `Last-Modified` and rebuilds on a change.
- **The open exercise is not complete.** In 2026 the state executed 68.3% of the
  authorized budget, against 96.1% in 2025. The screen shows that part, so the smaller pie
  chart reads as a calendar and not as a policy.
- **The source of the price index is unverified.** It blocks only the inflation button,
  which is out of scope.
- **One writer, no concurrency.** The aggregate holds 128,558 nodos, which is large. This
  is safe only while exactly one process writes one exercise at a time. A second writer
  would break that assumption.

## Changes from version 1

**Added.**

- P2b, the place for a path that the new exercise does not hold. Version 1 did not know
  that below the level of the programa more than half of the paths of 2025 are absent in
  2026.
- The deviation against the approved budget, on three places. The Congress approved 94.6
  and the state spent 123.5, and the deviation runs from -41% to +47% between
  jurisdicciones.
- The ladder approved, current, executed and paid on P3.
- The progressive source: the file high in the tree, the exact codes at the leaf.
- `Monto` carries its exercise, ADR 0001.

**Removed.**

- **The treemap.** Version 1 said "a treemap below level 1, because it scales when the
  slices get small". The measurement says the slices do not multiply: the median number of
  children is 1 or 2 at every level except the root, and only 52 nodos of the whole tree
  have more than 12 children, spread over 8 levels. A rule per level would give a treemap
  of one rectangle most of the time.

**Corrected.**

- Version 1 put the fiscal result in a panel beside the pie chart. It has its own place
  now, which gave room to the ladder of the execution.
- Version 1 assumed that the five measures order in every row. **They do not.**
  `devengado <= vigente` fails in 45.8% of the rows. The real rule holds at the level of
  the proyecto and above, with 0 exceptions in 2,673 nodos, and it breaks in 12.7% of the
  actividades. The cause is measured: of the 303 actividades that pass their own vigente,
  the parent proyecto respects its limit in 303 of 303 cases.
- That correction changed a decision of the wireframes. The deviation means one thing
  above the level of control and another below it, so the model gives it two types.
- Version 1 said the update is monthly. The build checks every day and rebuilds on a
  change, so it needs no knowledge of the cadence of the publisher.

## Handoff to writing-plans

Read this document first, then the three artifacts for detail.

- [x] Use cases in priority order, with KPIs
- [x] Modules per aggregate, command handlers, event publishers, processes. See "Model for
      the plan" in `03-domain-model.md`
- [x] Invariants as TDD targets: INV-01 to INV-07. **INV-05 first**: it is the only one
      whose failure produces wrong numbers that no sum reports
- [x] KPIs that need instrumentation: freshness, the two times, the coverage of the
      source, and the test that a failed verification stops the publication
- [x] Places per use case, sketches to build: `02-wireframes.md` level 3
- [x] Deferred questions with owner and due date: Q1 to Q11
- [x] Blocking questions: none
- [x] Approved by the user

**For the plan, two items that this spec does not decide:**

1. **Where the build runs and where the site lives**, question Q5. GitHub Actions is the
   candidate: the job needs no secret, because no source of this project needs a token.
   The risk to check is that a scheduled workflow stops when a repository stays quiet. A
   small manifest that the build commits on every change answers that, and it gives a
   public record of every change in the official numbers.
2. **The measurement of the two target times** on a real build. They are estimates today,
   and they are the only estimates that can make this design wrong.
