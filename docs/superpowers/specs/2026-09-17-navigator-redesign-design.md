# The navigator redesign: design spec

Version: 1, by brainstorming on 2026-09-17.
Base: `2026-09-14-public-spending-navigator-design.md`, version 2. This spec
changes the screens of the navigator. It does not change the data, the build,
the JSON files, the domain model or the invariants.
Stages run: brainstorming. **Skipped: eventstorming and domain-modeling.** The
user asked for the skip on 2026-09-17. The redesign adds no event, no command,
no aggregate and no invariant.
Next stages: wireframing (only the places that change), consolidating-the-spec,
writing-plans.
Reference prototype: `docs/designpowers/2026-09-17-navigator-redesign/prototype/index.html`.
The prototype reads the real data. It is a reference for the look and the
motion, and not code to copy as it is. It loads its typefaces from Google
Fonts; the site does not (R17). To open it, run the build, start
`python3 -m http.server 8000` at the root of the repository, and open
`http://localhost:8000/docs/designpowers/2026-09-17-navigator-redesign/prototype/`.

## Problem

The data and the depth of the navigator are correct. The user tested the
screens on 2026-09-16 and judged them hard to use:

- The text is hard to read. The 8 slices use one blue ramp, so two adjacent
  slices look the same.
- Nothing moves. A tap erases the screen and draws the next one. The visitor
  does not feel that they go into the data.
- The screen is a column of 38rem. At 1440x900 the list of the parts goes
  below the fold, and the sides of the screen stay empty.
- The breadcrumb repeats names, and it fills the header on a deep path.
- The year arrows look like a control that goes back.
- An open group "otros" has no entry in the history. The Back button of the
  browser leaves the group and its nodo together.

## Goals

| # | Goal |
|---|---|
| G1 | The visitor reads every number with no effort. |
| G2 | A tap feels like a step into the data: the tapped part grows into the whole. |
| G3 | The visitor always knows the place: the chart draws the path, the title names the nodo, the breadcrumb names the first level and the previous level. |
| G4 | One screen on a desktop: at 1440x900 and 1280x720 the page does not scroll. |
| G5 | Going back is obvious: the control "Volver", the breadcrumb, the key Escape, and the Back button of the browser. |
| G6 | The visitor can choose a dark theme and the view "Billetes". |

## Non-goals

- No new exercise. The user will add more years later (2026-09-17).
- No change to the build, to the JSON contract, or to the rule of 4%.
- P3, the fiscal result, and the inflation button stay out of scope.
- No dependency. No framework, no chart library, no file from another server.

## How the design was chosen

The agent built three prototypes on the real data: "La cinta" (a tape of an
adding machine beside a pie), "Billetes" (a sentence and the colours of the
peso bills) and "Anillos" (concentric rings that draw the path). The user
compared them on 2026-09-17 and chose a mix: the layout of "La cinta", the
chart of "Anillos", and "Billetes" as an optional view. A fourth prototype
built the mix. Two more rounds added the details of the user: "Volver", the
browser history, the text of the disc, no stamps, the name of the site, and
the line of the deviation.

## Decisions

| # | Decision | Replaces | Source |
|---|---|---|---|
| R1 | **Two panes.** The chart takes about 55% of the width, at the left. The tape takes about 45%, at the right. A top bar runs across both. On a telephone the panes stack, and the chart comes first. | The column of 38rem | user, 2026-09-17 |
| R2 | **A chart of concentric rings.** The disc in the center shows the amount of the nodo. The main ring holds the parts, and a tap on a part opens it. A thin ring shows the previous level, with the arc of the nodo lit. A hairline ring shows the first level, with the arc of the ancestor lit. A tap on a lit arc goes back to that level. | C5, a pie chart. The rule of 4% (C6, C7) does not change. | user, 2026-09-17 |
| R3 | **Every arc that the visitor can tap has a hit area of 24px or more.** The outer rings are thin, so the hit area is a transparent wide stroke. | - | agent |
| R4 | **The motion of a step down.** The tapped arc widens into the main ring. Its children start inside the angle of that arc. The old main ring moves out and gets thin. The motion takes 450 to 550ms with `cubic-bezier(0.23, 1, 0.32, 1)`. A step up plays the same motion in reverse. A new tap ends the running motion at once and starts the next one. | No motion | user, 2026-09-16 |
| R5 | **The tape.** The rows of the parts print in from the top, 30ms apart. The total rolls like an odometer. The list scrolls inside its panel. | The legend below the pie | user, 2026-09-17 |
| R6 | **No stamp on any screen.** The source at the foot of the tape stays. | The stamps "Las partidas suman el total" and "Coincide con el informe oficial" of the prototypes | user, 2026-09-17 |
| R7 | **The disc shows two lines.** The number is large ("123,5"). The unit is small under it ("billones", "millones" or "pesos"). The size of the number follows the inner radius, with a margin of 12% of that radius. The text never leaves the disc. | One line that overflowed | user, 2026-09-17 |
| R8 | **The name of the measure appears twice only:** in the subtitle of the root, and in the source at the foot of the tape. The disc does not say "crédito devengado". | The label on every screen | user, 2026-09-17 |
| R9 | **The breadcrumb is `Inicio › <level 1> › … › <previous>`.** The title names the current nodo, so the breadcrumb does not. "…" holds every level between, and it opens on a tap. Two names that differ only in accents or case count as the same name, because the source writes "Educacion" and "Educación". | UC-05, every name of the path. Closes Q7. | user, 2026-09-17 |
| R10 | **The control "Volver".** It sits at the left of the title, on every screen below the root. It shows an arrow and the word "Volver". It goes up one level, or out of a group "otros". Its hit area is 44x44px or more. The key Escape does the same. | - | user, 2026-09-17 |
| R11 | **The years: `‹ 2025 ›` at the right of the top bar.** A previous-year arrow, the year, and a next-year arrow sit before the two switches. The arrow at an end (2024, 2026) is disabled. The keys ArrowLeft and ArrowRight change the year. An older year slides in from the left, and a newer year from the right. The path stays, and P2b does not change (C17, C18). The arrows no longer look like "back", because "Volver" (R10) now does that job next to the title. | The arrows of C3 at the left of the screen. A segmented control, tried and rejected on 2026-09-17 | user, 2026-09-17 |
| R12 | **Every step is an entry in the history.** The root is `#/<year>`. A nodo is `#/<year>/<clave>`. A group "otros" keeps the hash of its nodo and adds the claves of the group in `history.state`. A change of year is an entry too. On `popstate`, the screen draws that entry with the motion that matches the direction. When the navigator skips a nodo with one child, it replaces the entry, so Back never lands on a skipped nodo. | A group "otros" with no entry | user, 2026-09-17 |
| R13 | **The switch "Oscuro"** in the top bar. It applies the dark tokens of "Anillos". Its first value comes from `prefers-color-scheme`. The page stores the choice in `localStorage`. The colours change with a crossfade of 200ms. | - | user, 2026-09-17 |
| R14 | **The switch "Billetes"** in the top bar. It applies the colours of the peso bills and the typeface Archivo. It adds one sentence under the title (R15). It works with "Oscuro" too: a dark variant of the bill colours keeps each slice at 3:1 or more on the dark ground. | - | user, 2026-09-17 |
| R15 | **The sentence of "Billetes".** "De cada $100 que gastó <nodo> en <año>, $<n> fueron a <largest part>." At the root, <nodo> is "el Estado nacional". When the largest part has the name of the nodo: "$<n> los gastó <nodo> en forma directa." At a nodo with no part to show, the sentence compares the nodo with the national total of the year. Under $1 the sentence says "<n> centavos". Under 1 centavo it says "menos de 1 centavo". | - | user, 2026-09-17 |
| R16 | **Four palettes:** light, dark, "Billetes" light and "Billetes" dark. The slice "otros" is always the neutral colour. Every slice holds 3:1 against its ground. Every text holds 4.5:1. A test checks every pair. | One blue ramp | agent |
| R17 | **The typefaces.** IBM Plex Sans for the interface. IBM Plex Mono for the amounts on the tape. Archivo for "Billetes". The site hosts the `woff2` files under `site/fuentes/`, with a Latin subset. All three use the SIL Open Font License. | The system font | agent |
| R18 | **The deviation stays (C19).** One line under the title uses the words of the product today. At the root: "96,1% de lo autorizado · +31% sobre lo aprobado". At a nodo: "<part>% del gasto total · <exec>% de lo autorizado · <signed>% <word>". The word is "sobre lo aprobado" at the level of the proyecto and above, and "de reasignación dentro del proyecto" below it (C23). In a group "otros" the line shows only the part of the total. | - | user, 2026-09-17, from C19 |
| R19 | **The new look covers every place:** P1, P2 at the institutional levels and at the levels of the object of the spending, P2b, P4 and the screen of a failure. The prototype covers only the institutional levels. | - | agent |
| R20 | **The name of the site starts the top bar.** "En qué la gastan", at the left, is a link to the root of the year on screen. The breadcrumb follows it. The top bar, from left to right: the name, the breadcrumb, `‹ 2025 ›`, "Oscuro", "Billetes". At 375px the top bar takes three rows: the name and the breadcrumb, the years, the switches. | - | user, 2026-09-17 |

## The places

```
+----------------------------------------------------------------+
| En que la gastan  Inicio > Capital Humano > Secretaria de Educ.|
|                           < 2025 >    (o) Oscuro   (o) Billetes|
+--------------------------------------+-------------------------+
| <- Volver  Desarrollo de la Educacion| Salario docente   54,9% |
|            Superior                  |          2,4 billones   |
| (execution and deviation line, R18)  | Personal no docente 33,7|
|                                      | ...                     |
|        .-~ hairline ring ~-.         |-------------------------|
|      .'  .- thin ring -.   '.        | Suma de estas partidas  |
|     /   /  main ring    \    \       |   4.457.061.255.600     |
|    |   |      4,5        |    |      | source, date, link      |
|    |   |    billones     |    |      |                         |
+--------------------------------------+-------------------------+
```

- **P1, the root.** The title "En qué la gastó el Estado nacional". The subtitle
  names the measure (R8). The deviation line (R18). No breadcrumb, no
  "Volver".
- **P2, a nodo.** "Volver" and the title. The deviation line. The breadcrumb
  (R9). At the end of a branch the chart shows one full ring, and the tape
  shows one row and the codes of the source (C16).
- **P2b, a path that does not exist in the year.** The same frame. The body
  keeps its two exits (C18).
- **P4, the sources.** The same top bar. The table of the files in the tape
  pane.
- **The failure screen.** The same top bar, with a message in the chart pane.

## How the code changes

The navigator already keeps the views (`vista*`, pure functions) apart from
the drawing (`dibujar*`, the DOM). The redesign keeps that split. Writing-plans
decides the final files. The units below are the proposal.

| Unit | Kind | Job |
|---|---|---|
| `anillos.js` | new, replaces `torta.js` | Pure geometry: the angles of the parts, the path of a ring segment, the interpolation between two ring states. A function draws the SVG from that geometry. |
| a motion runner | new | One loop on `requestAnimationFrame` for the rings and the odometer. It can end a motion at once. With reduced motion it gives a crossfade of 150ms. |
| `frase.js` | new, pure | The sentence of "Billetes" (R15). |
| the short breadcrumb | a new pure function in `arbol.js` | R9, with the comparison of names without accents and case. |
| `tema.js` | new | The two switches, their storage, and the first value of "Oscuro". |
| `app.js` | changed | The history of R12. The generation counter against a second `dibujar` stays. |
| `pantalla.js` | changed | The two panes, "Volver", the years, the disc, the tape. |
| `estilo.css` | rewritten | Tokens for the four palettes, chosen by two attributes on `<html>`. |
| `index.html` | changed | A small inline script sets the two attributes before the first paint, so the theme never flashes. |
| `site/fuentes/` | new | The font files and their licences. |

## Failures

| Failure | Behaviour |
|---|---|
| The data does not arrive | The failure screen of today, in the new look. |
| The clave does not exist in the year | P2b, as today. |
| `history.state` names a group that the data no longer has | Draw the nodo without the group, and replace the entry. |
| `localStorage` throws | Use the default theme. Nothing breaks. |
| A font file does not load | `font-display: swap` and a system fallback. |
| A tap arrives during a motion | End the motion at once, then start the next one (R4). |

## Tests

Pure units get tests with `node --test`:

- The geometry of the rings: the angles add up to 360 degrees; one part gives a
  full ring; the interpolation starts and ends at the right states.
- The short breadcrumb: depths 0 to 6; names repeated with and without accents.
- The sentence: the root, the same name, a nodo with no part, centavos, under
  1 centavo.
- The theme: no stored value, a storage that throws, a dark preference.
- The history: which step pushes an entry and which step replaces it.
- The contrast of every palette (R16).

The 106 tests of the navigator and the 78 tests of the build stay green.

A walk in a browser checks what a unit test cannot: no page scroll at
1440x900 and 1280x720; the layout at 375x812; the four palettes; a sequence of
Back and Forward; reduced motion; no error in the console.

## Success criteria

| Criterion | Target | Measured how |
|---|---|---|
| Page scroll on a desktop | none at 1440x900 and 1280x720 | the browser walk |
| Contrast | text 4.5:1, slices 3:1, in the four palettes | the contrast test |
| Duration of a step down | 450 to 550ms | the code and the browser walk |
| Back moves inside the navigator | every step of the walk | the browser walk |
| Errors in the console | 0 | the browser walk |
| Dependencies | 0 | no `package.json`, no script from another server |

## Open questions

**Blocking: none.**

| # | Question | Status | Owner | Due |
|---|---|---|---|---|
| RQ1 | Do the parts take a hue from the colour of their parent? | deferred. The prototype restarts the colours at every level | the user | wireframing |
| RQ2 | Does a telephone change the year with a swipe? | deferred | the user | wireframing |
| RQ3 | How many kilobytes do the font files cost? | open. Target: under 300 KB for the three families | the agent | writing-plans |
| RQ4 | Does "en forma directa" read well to a citizen? | open. Check it on the prototype | the user | wireframing |

## Changes to the base spec

- C3 (arrows for the exercise) is replaced by R11.
- C5 (a pie chart) is replaced by R2. The chart still shows the parts of a
  whole in a circle.
- UC-05 (a breadcrumb with every name) is replaced by R9.
- Q7 (the breadcrumb on a telephone) is closed by R9.
