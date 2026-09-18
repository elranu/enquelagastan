# The navigator redesign: design spec

Version: 2.1, consolidated on 2026-09-17. Version 1 by brainstorming on 2026-09-17 is in the git history.
Base: `2026-09-14-public-spending-navigator-design.md`, version 2. This spec changes the screens of the navigator. It does not change the data, the build, the JSON files, the domain model or the invariants.
Stages run: brainstorming, wireframing. **Skipped: eventstorming and domain-modeling**, because the redesign adds no event, no command, no aggregate and no invariant. The user asked for the skip on 2026-09-17.
Artifacts:
- `docs/designpowers/2026-09-17-navigator-redesign/02-wireframes.md`
- `docs/designpowers/2026-09-17-navigator-redesign/prototype/index.html`, the reference prototype
- `CONTEXT.md`: no change. `docs/adr/`: no new record.
Approved by: Mariano Julio Vicario on 2026-09-17

**The reference prototype.** It reads the real data. It is a reference for the look and the motion, and not code to copy as it is. The spec wins over the prototype in three points: the prototype has no link to P4 and no codes at the last level (W3), it loads its typefaces from Google Fonts (R17), and it covers only the institutional levels (R19). To open it, run the build, start `python3 -m http.server 8000` at the root of the repository, and open `http://localhost:8000/docs/designpowers/2026-09-17-navigator-redesign/prototype/`.

## Problem and goals

The data and the depth of the navigator are correct. The user tested the screens on 2026-09-16 and judged them hard to use. The text is hard to read, and the 8 slices use one blue ramp, so adjacent slices look the same. Nothing moves: a tap erases the screen and draws the next one. The screen is a column of 38rem, so at 1440x900 the list goes below the fold and the sides stay empty. The breadcrumb repeats names, the year arrows look like "back", and an open group "otros" has no entry in the history of the browser.

| # | Goal |
|---|---|
| G1 | The visitor reads every number with no effort. |
| G2 | A tap feels like a step into the data: the tapped part grows into the whole. |
| G3 | The visitor always knows the place: the chart draws the path, the title names the nodo, the breadcrumb names level 1 and the previous level. |
| G4 | One screen on a desktop: at 1440x900 and 1280x720 the page does not scroll. |
| G5 | Going back is obvious: "Volver", the key Escape, the breadcrumb, the outer rings, and the Back button of the browser. |
| G6 | The visitor can choose a dark look and the view "Billetes". |

## Non-goals and out of scope

- No new exercise. The user will add more years later (2026-09-17).
- No change to the build, to the JSON contract, or to the rule of 4%.
- P3, the fiscal result, and the inflation button stay out. They belong to later plans.
- No dependency: no framework, no chart library, no file from another server.
- No swipe gesture to change the year (W11).
- No analytics. The completion rates below stay estimates (Q11 of the base spec).

## Actors

| Actor | Who they are | Use cases |
|---|---|---|
| Visitor | A citizen, a journalist or a researcher, with no login and no knowledge of budget terms | UC-01 to UC-06, UC-08, UC-09 |

## What happens

The navigator only reads data, so it has no domain event. The visitor arrives at the root of the last closed exercise. The main ring grows once, and the rows of the tape print in. The visitor taps a part, and the part grows into the whole; the outer rings keep the path in sight. The visitor goes up with "Volver", Escape, a crumb, a lit outer arc, or Back. The visitor changes the year with the arrows, and the path stays. The visitor can switch the look at any time, with no change of place. Every step is an entry in the history of the browser, and a link to a nodo opens that nodo.
Diagram: `02-wireframes.md`, level 1 (the screen map).

## Use cases

| ID | Actor | Action | Priority | Success KPI | Volume | Places |
|---|---|---|---|---|---|---|
| UC-01 | Visitor | See the last closed exercise | must | chart visible under 2 s on a 4G telephone | 100, relative, estimate | P1, Failure |
| UC-02 | Visitor | Go one level down | must | under 1 s with the motion | 40 to 60, relative, estimate | P1, P2 |
| UC-03 | Visitor | Open the part "otros" | must | under 1 s | part of UC-02, estimate | P1, P2 |
| UC-04 | Visitor | Change the exercise | must | under 1.5 s with a new file | not measured | P1, P2, P2b |
| UC-05 | Visitor | Go up, and know the position | must | under 1 s | not measured | P1, P2 |
| UC-06 | Visitor | Know the source of a number | must | visible with no action | 2 to 5 to P4, relative, estimate | P1, P2, P2b, P4 |
| UC-08 | Visitor | Share a link | should | the link opens the same nodo | not measured | P2 |
| UC-09 | Visitor | Change the look | must | under 0.3 s | not measured | every place |

UC-07 (the fiscal result) is out of scope. Source: `02-wireframes.md`, level 0.

## Screens and flows

**UC-01.** The visitor opens the URL of the root. The top bar draws at once, and the chart pane says "Cargando el gasto público…". When the data arrives, the main ring grows once (W4) and the rows of the tape print in (R5). If the data does not arrive, the visitor lands on the failure screen.

**UC-02.** The visitor taps a part of the main ring or its row in the tape. When the children live in the object file, the file loads before the motion, and after 300ms the disc says "Cargando…" (W10). The tapped arc then widens into the main ring (R4). The navigator skips every nodo with one child, and the history keeps only the nodo where the visitor lands (R12). A nodo with no spending shows an empty ring outline. At the last level the chart shows one full ring, the tape shows one row, and the foot shows the codes of the rows (W3). A tap during a motion ends that motion at once.

**UC-03.** A tap on "otros" pushes an entry with the same hash and the claves of the group in `history.state` (R12). The title says "Otros", and the line under it shows only the part of the total (R18). "Volver" leaves the group. Back to a group that the data no longer has draws the nodo.

**UC-04.** The arrows or the keys change the year (R11). The screen slides in the direction of time, and the path stays. When the path does not exist in that year, the visitor lands on P2b. An open group "otros" closes, and the visitor stays on its nodo (W5). Two presses before the file arrives: the last press wins.

**UC-05.** The title names the nodo, the breadcrumb names level 1 and the previous level (R9), and the outer rings light the path (R2). "Volver" and Escape go up one level (R10). A crumb or a lit arc goes to its level; a dim arc does nothing (W7). The name of the site goes to the root (R20). Every step up pushes an entry (W6). After a shared link, Back leaves the site, as on any site, and "Volver" still goes up.

**UC-06.** The foot of the tape shows one line, always visible with no action: "Fuente: Presupuesto Abierto, Ministerio de Economía." (R22). A tap opens a dialog with the measure, the date, "Descargar el archivo oficial", and "De dónde salen estos números", which opens P4 (W3). P4 puts the method in the chart pane and the table of files in the tape pane (W13).

**UC-08.** The URL always holds the year and the path. A group "otros" is not in the URL, so a shared link opens its nodo (W8). An absent clave opens the nearest ancestor with a one-line notice. A hash that is not valid opens the root.

**UC-09.** "Oscuro" (R13) and "Billetes" (R14) change the look with a crossfade of 200ms, and never the place. A switch adds no history entry (W9). A storage that refuses writes keeps the look for this visit only.

**Failures**

| Failure | Behaviour |
|---|---|
| The data does not arrive | The failure screen, with the top bar and "Volver al inicio". |
| The clave does not exist in the year | P2b, with its two exits. |
| `history.state` names a group that the data no longer has | Draw the nodo without the group, and replace the entry. |
| `localStorage` throws | The default look. Nothing breaks. |
| A font file does not load | `font-display: swap` and a system font. |
| A tap arrives during a motion | End the motion at once, then start the next one. |

Places new: none. Places changed: P1, P2, P2b, P4, Failure.
Diagrams and sketches: `02-wireframes.md`, levels 1 to 3.

## Domain model

Unchanged. Domain modeling did not run for this redesign. The contexts, the aggregate `EjercicioPublicado` and the invariants INV-01 to INV-07 of the base spec stay as they are. INV-03 (the source is always visible) now lives at the foot of the tape.

## Glossary

Terms introduced or changed by this feature: none. "Volver", "Oscuro" and "Billetes" name controls of the interface, not terms of the budget.

## Decisions

| # | Decision | Alternatives rejected | Stage and level | ADR |
|---|---|---|---|---|
| R1 | **Two panes.** The chart takes about 55% of the width, at the left. The tape takes about 45%, at the right. A top bar runs across both. On a telephone the panes stack, and the chart comes first. | The column of 38rem | brainstorming | - |
| R2 | **A chart of concentric rings.** The disc in the center shows the amount of the nodo. The main ring holds the parts, and a tap on a part opens it. A thin ring shows the previous level, with the arc of the nodo lit. A hairline ring shows level 1, with the arc of the ancestor lit. A tap on a lit arc goes to that level. | C5, a pie chart. A sunburst of every level | brainstorming | - |
| R3 | **Every arc that navigates has a hit area of 24px or more**, as a transparent wide stroke. | The visible width only | brainstorming | - |
| R4 | **The motion of a step.** Down: the tapped arc widens into the main ring, its children start inside its angle, and the old main ring moves out and gets thin. Up: the same motion in reverse. 450 to 550ms, `cubic-bezier(0.23, 1, 0.32, 1)`. A new tap ends the running motion at once. With reduced motion: a crossfade of 150ms. | No motion. A library of motion | brainstorming | - |
| R5 | **The tape.** The rows print in from the top, 30ms apart. The row of "otros" shows the count of its parts. The total rolls like an odometer. The list scrolls inside its pane. | A legend below the chart | brainstorming | - |
| R6 | **No stamp on any screen.** | "Las partidas suman el total", which is always true. "Coincide con el informe oficial" | brainstorming | - |
| R7 | **The disc shows two lines**: the number, large, and the unit, small ("billones", "millones" or "pesos"). The size of the number follows the inner radius, with a margin of 12% of that radius. | One line that overflowed | brainstorming | - |
| R8 | **The measure is named twice only**: in the subtitle of the root, and in the foot of the tape. | "crédito devengado" on every screen | brainstorming | - |
| R9 | **The breadcrumb is `Inicio › <level 1> › … › <previous>`.** It never names the current nodo, because the title does. "…" holds every level between, and it opens on a tap. Names that differ only in accents or case are one crumb ("Educacion", "Educación"). | UC-05 of the base spec, every name of the path. Closes Q7 of the base spec | brainstorming | - |
| R10 | **"Volver"** sits at the left of the title on P2, and in a group "otros". An arrow and the word "Volver". It goes up one level, or out of the group. Hit area 44x44px or more. Escape does the same. | Back of the browser only | brainstorming, corrected by W12 | - |
| R11 | **The years: `‹ 2025 ›` at the right of the top bar**, before the two switches. The arrows have the accessible names "Año anterior" and "Año siguiente". The arrow at an end (2024, 2026) is disabled. ArrowLeft and ArrowRight change the year. An older year slides in from the left, a newer year from the right. The path stays (C17), and P2b does not change (C18). | C3, the arrows at the left of the screen. A segmented control of years, tried on 2026-09-17 | brainstorming | - |
| R12 | **Every step is an entry in the history.** The root is `#/<year>`. A nodo is `#/<year>/<clave>`. A group "otros" keeps the hash of its nodo and puts its claves in `history.state`. A change of year is an entry. `popstate` draws the entry with the motion of its direction. A skip of a nodo with one child replaces the entry. | A group with no entry | brainstorming | - |
| R13 | **The control "Tema" has three states**: sistema, claro, oscuro (R22). "Sistema" applies the dark tokens with `prefers-color-scheme`, and it follows the system with no reload. The choice goes to `localStorage`. The colours change with a crossfade of 200ms. | No dark look. Two states only | brainstorming, corrected on 2026-09-17 | - |
| R14 | **The control "Billetes"** applies the colours of the peso bills and the typeface Archivo, and adds the sentence of R15. It works with "Tema": a dark variant of the bill colours. It shows an icon of a banknote and no word (R23). | A separate page | brainstorming, corrected on 2026-09-17 | - |
| R15 | **The sentence of "Billetes".** "De cada $100 que gastó <nodo> en <año>, $<n> fueron a <largest part>." At the root, <nodo> is "el Estado nacional". When the largest part has the name of the nodo: "$<n> los gastó <nodo> en forma directa." At a nodo with no part to show, the sentence compares the nodo with the national total. Under $1: "<n> centavos". Under 1 centavo: "menos de 1 centavo". | "menos de $1" | brainstorming | - |
| R16 | **Five palettes**: light, dark, "Billetes" light, "Billetes" dark, and "Billetes" under "sistema" on a dark system (R24). "otros" is always the neutral colour. Every slice holds 3:1 against its ground, every text 4.5:1. A test checks every pair, in every palette. | One blue ramp. Four palettes only, which missed the case a dark-OS visitor with "Billetes" on actually gets (review, fix round 1, 2026-09-24) | brainstorming; corrected 2026-09-24 | - |
| R17 | **The typefaces**: IBM Plex Sans for the interface, IBM Plex Mono for the amounts of the tape, Archivo for "Billetes". The site hosts the `woff2` files under `site/fuentes/`, with a Latin subset. SIL Open Font License. | The system font. Google Fonts | brainstorming | - |
| R18 | **The line of the execution and the deviation stays (C19), with its own colour (R25).** At the root: "96,1% de lo autorizado · +31% sobre lo aprobado". At a nodo: "<part>% del gasto total · <exec>% de lo autorizado · <signed>% <word>". The word is "sobre lo aprobado" at the level of the proyecto and above, "de reasignación dentro del proyecto" below it (C23). In a group "otros": only the part of the total. | Drop the line, as the prototype did. The colour of the secondary text (`--tenue`), which reads as a caption, not a fact that stands apart | brainstorming, corrected on 2026-09-17 | - |
| R19 | **The new look covers every place**: P1, P2 at the institutional levels and at the levels of the object of the spending, P2b, P4 and the failure screen. | Only the places of the prototype | brainstorming | - |
| R20 | **The name of the site starts the top bar.** "En qué la gastan", a link to the root of the year on screen. From left to right: the name, the breadcrumb, `‹ 2025 ›`, "Oscuro", "Billetes". At 375px: three rows. | No name on the screen | brainstorming | - |
| R21 | **The accessibility floor of the navigator stays**: a visible focus ring; every part reachable as a row of the tape; one live region that says what changed; reduced motion respected. | - | brainstorming, from the base navigator | - |
| W1 | No new place. The five places change. | A place for the settings of the look | wireframing, 1 | - |
| W2 | One top bar on every place. | A top bar only on P1 and P2 | wireframing, 1 | - |
| W3 | The link to P4 and the codes of the source at the last level stay. | Follow the prototype, which lost them | wireframing, 1 | - |
| W4 | On the first load the main ring grows once. No other motion starts without a tap. | No motion on load | wireframing, 2 | - |
| W5 | A change of year closes an open group "otros" and keeps its nodo. | Keep the group. Go to the root | wireframing, 2 | - |
| W6 | Every step pushes one entry, "Volver" too. | "Volver" calls Back | wireframing, 2 | - |
| W7 | Only a lit arc of an outer ring navigates. | A dim arc jumps to that sibling | wireframing, 2 | - |
| W8 | A group "otros" is not in the URL. | The claves of the group in the URL | wireframing, 2 | - |
| W9 | A switch of the look adds no history entry. | Back undoes a switch | wireframing, 2 | - |
| W10 | Data loads before the motion; after 300ms the disc says "Cargando…". | Start the motion and fill it later | wireframing, 2 | - |
| W11 | No swipe changes the year. Closes RQ2. | A swipe on the chart | wireframing, 2 | - |
| W12 | P2b shows no "Volver". | "Volver" beside its two exits | wireframing, 3 | - |
| W13 | P4 puts the method in the chart pane and the table of files in the tape pane. | P4 in one column | wireframing, 3 | - |
| W14 | The parts do not take a hue from their parent; the colours restart at every level, by size. The lit arc of the thin ring keeps the colour of the parent. Closes RQ1. | Tones of the parent colour | wireframing, 3 | - |
| W15 | "$<n> los gastó <nodo> en forma directa" stays. Closes RQ4. | "fueron al propio <nodo>", whose article must agree with every name | wireframing, 3 | - |
| R22 | **The foot of the tape shows one line, a control.** A tap opens a native `<dialog>` (`showModal()`, no library, no custom backdrop) with the measure, the file, its date, "Descargar el archivo oficial", "De dónde salen estos números" and, at the last level, the codes (C16). "Cerrar" and Escape close it; the navigator's own Escape does nothing while the dialog is open. INV-03 still holds: the source is visible with no action. | Keep the foot at two or three lines | owner feedback, 2026-09-17 | - |
| R23 | **"Tema" and "Billetes" are icon controls.** "Tema" cycles sistema, claro, oscuro (R13) with one inline SVG per state (a screen, a sun, a moon) and no word; it is a `<button>`, not a switch, because a switch has two states. Its accessible name says the state and the next tap, e.g. `aria-label="Tema: sistema. Tocar para el tema claro."` "Billetes" keeps its two states, `role="switch"` and `aria-checked`, with an inline SVG of a banknote and `aria-label="Billetes"`, and no word. Both sit at the right of the top bar with a hit area of 44x44px or more. | Keep the words "Oscuro" and "Billetes" | owner feedback, 2026-09-17 | - |
| R24 | **One CSS source for the dark palette, and for the dark bill colours.** The forced dark look (`[data-tema="oscuro"]`) and the system dark look (`[data-tema="sistema"]` under `prefers-color-scheme: dark`) read the same tokens, written once. The same holds for "Billetes" on a dark ground: `[data-tema="oscuro"][data-vista="billetes"]` and `[data-tema="sistema"][data-vista="billetes"]` (also under `prefers-color-scheme: dark`) read the same seven bill hexes, written once, so a fifth palette ("billetes sistema oscuro") exists and holds R16, alongside light, dark, "Billetes" light and "Billetes" dark. | Write the dark values twice. Two selectors of equal specificity for the dark bill colours, which lets source order decide and breaks R16 (review, fix round 1, 2026-09-24) | owner feedback, 2026-09-17; corrected 2026-09-24 | - |
| R25 | **The line of the execution and the deviation gets its own token, `--dato`, in the five palettes, 4.5:1 against its ground, with two hexes no other token uses.** One colour in every case: R18's line reports a fact (C19), never a judgement, so it is never green for good or red for bad. | Reuse `--tenue`. Reuse `--acento`'s hexes under a new name, which still doubles as the link colour and, in light, as `--foco` (review, fix round 1, 2026-09-24) | owner feedback, 2026-09-17; corrected 2026-09-24 | - |

## Open questions

Blocking: none.

| # | Question | Status (deferred) | Owner | Due |
|---|---|---|---|---|
| RQ3 | How many kilobytes do the font files cost? Target: under 300 KB for the three families | closed: 181,032 bytes (181.0 KB) for the three families, under the target of 300 KB, measured by test/estilo.test.mjs on 2026-09-17 | the agent | done |

Closed: RQ1 by W14, RQ2 by W11, RQ4 by W15. Q7 of the base spec by R9. The other open questions of the base spec do not change.

## Success KPIs

| KPI | Baseline today | Target | Window | Measured how | Owner |
|---|---|---|---|---|---|
| Page scroll on a desktop | yes: the list goes below the fold at 1440x900 | none at 1440x900 and 1280x720 | every release | a browser walk | the agent |
| Contrast | text passes; adjacent slices look the same | text 4.5:1, slices 3:1, five palettes | every release | a unit test on the palettes | the agent |
| Duration of a step | 0ms, no motion | 450 to 550ms | every release | the code, and a browser walk | the agent |
| Back moves inside the navigator | fails after a group "otros" | every step of the walk | every release | a browser walk of Back and Forward | the agent |
| Chart visible after the first load | not measured | under 2 s on a 4G telephone, estimate | every release | a performance mark when the ring appears, read in a browser walk | the agent |
| Errors in the console | 0 | 0 | every release | a browser walk | the agent |
| Dependencies | 0 | 0 | every release | no `package.json`, no script or font from another server | the agent |
| Completion rate of each use case | not measured | 85% to 95%, estimate | - | no measurement point: the product has no analytics (Q11 of the base spec) | the user |

KPIs without a measurement point today: the time to a visible chart (the plan adds the performance mark), and the completion rates (no analytics, by scope).

## Size and volume

| Use cases must / should / could | Places new / changed | Contexts | Aggregates | Entities and value objects | Invariants | Processes | External systems |
|---|---|---|---|---|---|---|---|
| 7 / 1 / 0 | 0 / 5 | 1 changed (Navegacion), 0 new | 0 | 0 | 0 new | 0 | 0 new |

| Commands per day (sum) | Peak commands per hour | Expected instances per year (largest aggregate) | Numbers confirmed / estimated |
|---|---|---|---|
| 0: the navigator only reads | not applicable | not applicable | 22 confirmed / 21 estimated |

The confirmed numbers are the sizes of the screen, the durations, the hit areas, the margins, the contrast ratios, the rule of 4%, the level of control, and the totals of 2025 read from the data. The estimated numbers are the 5 relative weights of the visits and the 16 targets of time and completion of `02-wireframes.md`.

## Traceability

The navigator has no command and no aggregate, so the table traces use cases to affordances, decisions and test targets.

| UC | Places | Affordances (02) | Decisions | Test targets | Success KPI |
|---|---|---|---|---|---|
| UC-01 | P1, Failure | A19 | R1, R5, R7, R8, R18, W4 | the text of the disc fits; the line of the deviation at the root | chart visible under 2 s |
| UC-02 | P1, P2 | A11, A14 | R2, R3, R4, W10 | the geometry of the rings; the skip of a nodo with one child replaces the entry | under 1 s |
| UC-03 | P1, P2 | A11, A14, A10 | R12, R18, W8 | a group pushes an entry with its claves; a missing group draws the nodo | under 1 s |
| UC-04 | P1, P2, P2b | A6, A7, K2, A17, A18 | R11, W5 | the arrows stop at the ends; the path stays | under 1.5 s |
| UC-05 | P1, P2 | A1, A2, A3, A4, A5, A10, A12, A13, K1, B1, B2 | R9, R10, R12, R20, W6, W7 | the short breadcrumb at depths 0 to 6, with and without accents | under 1 s |
| UC-06 | P1, P2, P2b, P4 | A15, A16, A20, A21 | W3, W13, R22 | the foot is on every place; the dialog holds the codes at the last level; Escape closes the dialog only | visible with no action |
| UC-08 | P2 | the URL | R12, W8 | a hash opens its nodo; an absent clave opens the nearest ancestor | the link opens the same nodo |
| UC-09 | every place | A8, A9 | R13 to R17, R22 to R25, W9, W14, W15 | the theme with no storage and with a storage that throws; the sentence; the contrast of the five palettes, with `--dato`; the system look changes with no reload | under 0.3 s |

## Risks and assumptions

- **The redesign stands on a branch that is not merged.** `navigator-redesign` starts from `navigator-plan`, which holds 39 commits that are not pushed. If a review changes `navigator-plan`, the redesign must rebase. Merge `navigator-plan` first.
- **The site is not live.** GitHub Pages fails because the repository is private. The redesign can ship to `main` and still stay invisible until the user makes the repository public.
- **The motion on a slow telephone.** About 20 arcs interpolate on every frame. If a step drops frames, the motion runner can shorten the step or fall back to the crossfade. Estimate, not measured.
- **The weight of three typefaces.** If the files pass 300 KB, the first paint gets slower (RQ3). Mitigations: a Latin subset, `woff2`, `font-display: swap`, or one family fewer.
- **The estimated targets.** A target of time wrong by 10x (20 s for UC-01) would break the product. The first file is 177 KB with gzip, measured on the base plan, so the risk is low. A completion rate wrong by 10x changes no design decision.
- **The prototype and the spec differ in three points** (the link to P4 and the codes, the typefaces, the object levels). The plan follows the spec.
- **External systems:** none new. The data source of the base spec does not change.

## Changes from version 1

- Added: UC-09 as a use case; R21, the accessibility floor, stated; W1 to W15 from wireframing; the performance mark as a measurement point.
- Removed: none.
- Corrected: R10 put "Volver" on every screen below the root; W12 removes it from P2b. RQ1, RQ2 and RQ4 are closed.
- Corrected on 2026-09-17, from owner feedback after the redesign landed: R13 (the theme is three states, sistema, claro, oscuro), R14 (the view "Billetes" is an icon, R23), R18 and UC-06 (the foot shows one line, and a dialog holds the rest, R22), the line of the execution and the deviation gets its own colour (R25). Added R22 to R25.
- Corrected on 2026-09-24, from review, fix round 1: R16 (a fifth palette, "billetes sistema oscuro", since the forced-dark and system-dark bill colours shared one specificity and let source order pick the wrong one); R24 (the same one-source rule now also covers the dark bill colours); R25 (`--dato` gets two hexes of its own, not `--acento`'s).

## Handoff to writing-plans

Read this document first, then `02-wireframes.md` for the flows and the sketches, then the prototype for the look and the motion.

- [x] Use cases in priority order, with KPIs: see "Use cases".
- [x] Modules. No aggregate changes. The proposed units, and writing-plans decides the final files:
  - `site/app/anillos.js`, new, replaces `torta.js`: the pure geometry of the rings and the drawing of the SVG.
  - a motion runner, new: one loop on `requestAnimationFrame` for the rings and the odometer, with an instant end and the reduced-motion path.
  - `site/app/frase.js`, new, pure: the sentence of R15.
  - a pure function in `site/app/arbol.js`: the short breadcrumb of R9.
  - `site/app/tema.js`, new: the two switches and their storage.
  - `site/app/app.js`, changed: the history of R12; the generation counter stays.
  - `site/app/pantalla.js`, changed: the two panes, "Volver", the years, the disc, the tape, P2b, P4, the failure screen.
  - `site/estilo.css`, rewritten: the tokens of the five palettes, chosen by two attributes on `<html>`.
  - `site/index.html`, changed: an inline script sets the two attributes before the first paint.
  - `site/fuentes/`, new: the font files and their licences.
- [x] Invariants as TDD targets. No new invariant. Test targets: the geometry of the rings (the angles add up to 360 degrees, one part gives a full ring, the interpolation starts and ends at the right states); the short breadcrumb (depths 0 to 6, names with and without accents); the sentence (the root, the same name, a nodo with no part, centavos, under 1 centavo); the fit of the text of the disc; the theme (no stored value, a storage that throws, a dark preference); the history (which step pushes and which replaces); the contrast of the five palettes. The 106 tests of the navigator and the 78 tests of the build stay green.
- [x] KPIs that need instrumentation: a performance mark when the ring first appears. The completion rates have no measurement point, by scope.
- [x] Places per use case, sketches to build: `02-wireframes.md`, level 3 (the top bar, P1, P2, P2b, P4, Failure).
- [x] Deferred questions with owner and due date: RQ3, the agent, writing-plans.
- [x] Blocking questions: none.
- [x] Approved by the user.

The font files come from outside the repository. Downloading them needs the permission of the user, with the file names, the source and the sizes.
