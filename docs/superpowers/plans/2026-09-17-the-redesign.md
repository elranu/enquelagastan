# The navigator redesign: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ] `) syntax for tracking.

**Goal:** Turn the screens of the navigator into one frame of two panes: a chart of concentric rings at the left, a tape of rows at the right, and a top bar across both. A tap makes the tapped part grow into the whole. Every step is an entry in the history of the browser. Two switches give a dark look and the view "Billetes".

**Architecture:** The page stays static, with no framework and no step of build. `site/index.html` holds the frame once. Pure modules compute the rings, the breadcrumb, the sentence, the look and the model of the history, and each one has its own tests. `pantalla.js` turns the data into views and writes the parts of the frame. `app.js` joins them with the history of the browser and with one motion runner on `requestAnimationFrame`.

**Tech Stack:** HTML, CSS and JavaScript of the browser. ES modules, no bundler. `node --test`, which ships with Node, for the tests. No framework, no chart library, no motion library.

**Spec:** `docs/superpowers/specs/2026-09-17-navigator-redesign-design.md`, version 2. Read it first. Then read `docs/designpowers/2026-09-17-navigator-redesign/02-wireframes.md` for the flows, the affordance IDs (A1 to A21, K1, K2, B1, B2) and the sketches. The reference prototype is `docs/designpowers/2026-09-17-navigator-redesign/prototype/index.html`.

**The plan before this one:** `docs/superpowers/plans/2026-09-15-the-navigator.md` built the code that this plan changes.

## Global Constraints

- **No dependency.** No `package.json`. The page loads no script, no style and no font from another server. The tests use `node:test`, `node:assert` and `node:fs` only.
- **Run the tests with `node --test` and no directory argument.** Node 26 reads `node --test test/` as a module path, and it fails. One file is fine: `node --test test/anillos.test.mjs`. Node also runs `test/falso-documento.mjs` as a file with no test, and it counts that file as one passing test. The counts in this plan include it.
- **The Python tests stay green:** `python -m unittest discover -s tests` gives 78 tests (1 skipped). This plan touches no Python file.
- **No step of build for the front end.** The browser loads the ES modules that the repository holds.
- Every file is in English, in ASD-STE100: sentences of 25 words or fewer, active voice, one idea per sentence. This binds the code comments. **The name of a test (the string passed to `test(...)`) stays in Spanish, and its explanatory comment is in English.** See `docs/WRITING_STYLE.md`.
- **The copy of the product is in Spanish of Argentina.** The name is `En qué la gastan`, with the spaces and the accent.
- The identifiers keep their Spanish spelling, as the codebase does: `nodo`, `clave`, `miga`, `porcion`, `anillo`, `cinta`, `frase`, `tema`, `pila`, `ruta`.
- Every file name is in kebab-case.
- The branch is `navigator-redesign`. Commit only the files of your own task, with the message of its commit step. **Do not push.**
- **Keep what the spec keeps:** the rule of 4% (`porciones.js`); `NIVEL_DE_CONTROL = 7`; `saltarHijoUnico`; the root total from `entrada.total_devengado`; `ejerciciosDisponibles` and `en_este_artefacto`; `esAusencia` (only a 404 means absent); the object files joined at level 9 (`indiceParaClave`); the generation counter against a second draw; the live region `#aviso` outside `#app`; INV-03 (the source is always visible); C16 (the codes of the source at the last level).
- The values of the spec, word for word:
  - R1: the chart takes about 55% of the width, the tape about 45%. On a telephone the panes stack, and the chart comes first.
  - R3: every arc that navigates has a hit area of 24px or more.
  - R4: a step lasts 450 to 550ms, with `cubic-bezier(0.23, 1, 0.32, 1)`. With reduced motion: a crossfade of 150ms.
  - R5: the rows print in from the top, 30ms apart.
  - R7: the number of the disc keeps a margin of 12% of the inner radius.
  - R10: "Volver" has a hit area of 44x44px or more.
  - R13: the colours change with a crossfade of 200ms.
  - R16: every slice holds 3:1 against its ground, every text 4.5:1, in four palettes.
  - W10: after 300ms the disc says "Cargando…".
  - G4: at 1440x900 and 1280x720 the page does not scroll.
  - RQ3: the three families of type weigh under 300 KB.

## The contract with the build

Unchanged from the plan before. The build publishes these files under `site/data/`, and this plan reads them and never writes them:

```
site/data/manifest.json
site/data/<ejercicio>/institucional.json
site/data/<ejercicio>/objeto/<camino de 9 codigos>.json
```

A nodo is `{"n": name, "d": devengado, "p": presupuestado, "v": vigente, "g": pagado, "k": [child codes]}`, with amounts in millions of pesos. The key of a nodo is its camino joined with `-`. The navigator shows `d`. See the section of the same name in `docs/superpowers/plans/2026-09-15-the-navigator.md` for the real values.

## What this plan does not build

- P3, the fiscal result, and the button that removes the inflation. They belong to later plans.
- A swipe that changes the year (W11).
- Analytics. The completion rates of the spec stay estimates.
- A new exercise, or any change to the build, the JSON files or the rule of 4%.

## Decisions this plan takes

The spec wins over the prototype. Where the spec, the wireframes, the prototype and the code disagree, this plan decides as follows.

| # | Contradiction | Decision |
|---|---|---|
| D1 | The lit arc of the hairline ring (A13). The prototype goes to the root. The wireframes say "PLACE: P2 (level 1)". | Follow the wireframes. The thin ring goes to the previous level, and the hairline ring goes to level 1. At depth 2 both go to level 1. |
| D2 | The last level. The spec (UC-02) shows one full ring and one row. The prototype shows no row. | Follow the spec. The nodo is its own one part. The row is not a control, because it opens nothing. |
| D3 | An absent clave. Plan 2 shows P2b for every absent clave. The spec shows P2b after a change of year, and the nearest ancestor with a notice for a link (UC-08). | A change of year puts the exercise of origin in `history.state` as `desde`. An absent clave with `desde` shows P2b. With no `desde`, the navigator opens the ancestor and replaces the entry. Back and Forward to a P2b entry show P2b again. |
| D4 | The easing. The prototype uses `1 - (1 - t)^4`, which gives 0.9375 at half the time. `cubic-bezier(0.23, 1, 0.32, 1)` gives 0.96598. | Implement the cubic Bézier itself, with a bisection. |
| D5 | The sentence of R15 names "the largest part". The prototype takes the first row, and "otros" always goes last, even when it is the largest. | Take the part with the largest amount. |
| D6 | The top bar is on every place (W2), but P4 and the failure screen belong to no exercise. | On P4 and on the failure screen the year is empty and both arrows are disabled. "Volver al inicio" goes to the root of the last year on screen. |
| D7 | The failure sketch puts "De dónde salen estos números" in the chart pane. INV-03 puts the source in the foot. | The link goes in the chart pane. The foot keeps the line "Fuente: Presupuesto Abierto". |
| D8 | `README.md` says the site is live. The spec (Risks) says GitHub Pages fails, because the repository is private. | Task 14 does not change that line. The report of Task 14 names the contradiction for the user. |
| D9 | The font files need a size before the download, and the sizes need a lookup on the network. | Task 13 has two gates: one for the lookup of three small CSS files, one for the download. |

## Adjustments to the task list of the brief

| Brief | This plan | Reason |
|---|---|---|
| 8, the frame | Task 8 (the views, pure) and Task 9 (the painters) | A task that changes the views, the painters, the page and `app.js` at once is too large to review. The views need no DOM, so they come first. |
| 9, the history | Task 10, with the frame on screen | The old `app.js` draws whole screens into `#app`, and the frame replaces `#app`. The history also needs the pila of Task 8. One switch of `app.js` is safer than two rewrites. |
| 10, the rings and the motion | Task 10 draws the rings with no motion. Task 11 adds the motion. `torta.js` goes in Task 10. | `torta.js` loses its last caller in Task 10. A dead file for one task has no value. |
| 11, P2b, P4, failure | Task 9 (their painters) and Task 10 (their wiring) | Every place writes into the same frame. A place outside the frame would leave the site broken between two tasks. |
| 12, the performance mark | Task 11 | The mark belongs to the code that paints the ring the first time. |
| 4, the fit of the disc | `tamanioDelDisco` in `anillos.js` | The fit needs the inner radius, `RADIO_DEL_DISCO`, which lives there. |

## The reuse gate

Every new unit went through `designpowers:reusing-before-creating`.

| New unit | Searched | Found | Decision |
|---|---|---|---|
| `site/app/anillos.js` | `site/app/`, the prototype, the platform (SVG) | `torta.js` draws wedges from the center, not rings. The prototype has `escena`, `arco` and `fantasma`. | create, and replace `torta.js`: the geometry of a ring is new. Port the prototype. |
| `site/app/movimiento.js` | `site/app/`, CSS transitions, the Web Animations API, the prototype | No runner in the code. CSS cannot interpolate the `d` of a path in every browser. The prototype has `animar` and `odometro`. | create a runner of 60 lines for the arcs and the odometer. CSS keeps the print of the rows, the slide of a year and the crossfade. |
| `site/app/frase.js` | `formato.js`, the prototype | The prototype has `deCien` and `frase` inline. | create, pure. It reuses `llano` of `arbol.js`. |
| `site/app/tema.js` | `site/app/`, the platform | Nothing in the code. The platform gives `localStorage`, `matchMedia` and the View Transitions API. The prototype has `interruptor`. | create, and use the platform with no wrapper library. |
| `migaCorta`, `llano` in `arbol.js` | `arbol.js` | `migaDePan` names every level and keeps the shallowest of equal names. R9 changes that rule. | extend `arbol.js`. Task 10 deletes `migaDePan`, which loses its callers. |
| The model of the history | `ruta.js`, the prototype | `leerRuta`, `escribirRuta`, `ancestroQueExiste`. | extend `ruta.js`. |
| `pilaDe`, `vistaDeNavegador`, the painters | `pantalla.js`, the prototype (`pilaHasta`) | `resolverPantalla` and the views of plan 2. | extend `pantalla.js`. The views of plan 2 stay and feed the new view. |
| The history in the fakes | `test/falso-documento.mjs` | A fake document, window and history with `replaceState` only. | extend the fakes. |
| The contrast test | `test/`, the tools of the machine | No contrast check. | create a test with the formula of WCAG 2.x, in 20 lines, and no dependency. |
| `site/fuentes/` | the platform | `@font-face` and `font-display: swap`. | create: the files of the fonts, with no loader script. |

Duplicates found: `contiene` (a clave inside a camino) existed twice in the drafts of Task 7 and Task 8. Task 7 exports it from `ruta.js`, and Task 8 imports it.

## File structure

| File | Responsibility | Task |
|---|---|---|
| `site/app/anillos.js` | The geometry of the rings, the scene, the motion between two scenes, the SVG markup, the fit of the disc. Pure. | 1, 4 |
| `site/app/arbol.js` | Adds `llano` and `migaCorta`. Loses `migaDePan`. | 2, 10 |
| `site/app/frase.js` | The sentence of "Billetes". Pure. | 3 |
| `site/app/formato.js` | Adds `partesDelMonto`. | 4 |
| `site/app/tema.js` | The two switches and their storage. | 5 |
| `site/app/movimiento.js` | The motion runner, the easing, the odometer. | 6 |
| `site/app/ruta.js` | Adds the model of the history. | 7 |
| `site/app/pantalla.js` | Adds the pila, the view of the frame, the painters and the motion of the frame. Loses the `dibujar*` functions. | 8, 9, 10, 11 |
| `site/index.html` | The frame, and the inline script of the look. | 10, 12 |
| `site/app/app.js` | The history, the steps, the keys, the switches. | 10, 11 |
| `site/app/torta.js` | Deleted. | 10 |
| `site/estilo.css` | Rewritten: the four palettes, the two panes, the rings, the tape. | 12, 13 |
| `site/fuentes/` | The `woff2` files and their licences. | 13 |
| `test/*.test.mjs` | One file per module, and `estilo.test.mjs` for the palettes and the page. | every task |
| `README.md`, `CLAUDE.md` | The description of the product. | 14 |

## The count of the tests

| After task | JavaScript tests (`node --test`) | Change |
|---|---|---|
| start | 106 | 105 tests and `falso-documento.mjs` |
| 1 | 122 | +16 `anillos.test.mjs` |
| 2 | 127 | +5 `arbol.test.mjs` |
| 3 | 132 | +5 `frase.test.mjs` |
| 4 | 134 | +1 `formato.test.mjs`, +1 `anillos.test.mjs` |
| 5 | 139 | +5 `tema.test.mjs` |
| 6 | 147 | +8 `movimiento.test.mjs` |
| 7 | 153 | +6 `ruta.test.mjs` |
| 8 | 161 | +8 `pantalla.test.mjs` |
| 9 | 171 | +10 `pantalla.test.mjs` |
| 10 | 156 | -17 `pantalla.test.mjs`, -2 `arbol.test.mjs`, -7 `torta.test.mjs`, +11 `app.test.mjs` |
| 11 | 163 | +5 `pantalla.test.mjs`, +2 `app.test.mjs` |
| 12 | 166 | +3 `estilo.test.mjs` |
| 13 | 167 | +1 `estilo.test.mjs` |
| 14 | 167 | none |

Every number above comes from a run of the code of this plan on a copy of the repository.

---

### Task 1: The geometry of the rings

The chart has three rings around a disc (R2). The main ring holds the parts of the nodo. The thin ring shows the previous level, with the arc of the nodo lit. The hairline ring shows level 1, with the arc of the ancestor lit. A step down makes the tapped arc widen into the main ring (R4). This task ports the geometry and the motion of the prototype as pure functions.

**Files:**
- Create: `site/app/anillos.js`
- Test: `test/anillos.test.mjs`

**Interfaces:**
- Consumes: a `porcion` of `porciones.js`: `{ nombre, monto, parte, esOtros, destino: string[] }`.
- Produces:
  - `VUELTA` (2π); `RADIOS = { principal: [0.44, 0.80], previo: [0.845, 0.895], primero: [0.94, 0.955] }`, in units of a viewBox of `-1 -1 2 2`; `RADIO_DEL_DISCO = 0.44`; `OPACIDAD_TENUE = 0.28`.
  - `colorDe(porcion, orden, cantidad) -> "var(--c0)" … "var(--c6)" | "var(--otros)"`.
  - `angulosDe(porciones) -> [{ a0, a1 }]`, in radians from 12 o'clock, clockwise.
  - `caminoDeAnillo({ r0, r1, a0, a1 }) -> string`, the `d` of an SVG path. `""` for no angle or no width.
  - `escenaDe(pila) -> Arco[]`. A level of `pila` is `{ porciones, elegida, hoja }`. An `Arco` is `{ llave, nivel, rol, padre, orden, color, r0, r1, a0, a1, opacidad, abrir, subir }`. `rol` is `"principal"`, `"previo"` or `"primero"`. `abrir` is the order of the part to open, or `null`. `subir` is the index in the pila of the level to go to, or `null`.
  - `interpolar(desde: Arco[], hasta: Arco[]) -> (t) => Arco[]`.
  - `desdeCero(arcos) -> Arco[]`, the same arcs with no angle.
  - `svgDeEscena(arcos) -> string`, the markup of the paths. Task 9 writes it into `#anillos`.


- [ ] **Step 1: Write the failing test**

Create `test/anillos.test.mjs`:

```javascript
import test from "node:test";
import assert from "node:assert/strict";

import {
  angulosDe, caminoDeAnillo, colorDe, desdeCero, escenaDe, interpolar,
  OPACIDAD_TENUE, RADIOS, svgDeEscena, VUELTA,
} from "../site/app/anillos.js";

const parte = (nombre, valor, destino, esOtros = false) => ({
  nombre, monto: valor * 100, parte: valor, esOtros, destino,
});

// The root: two parts and a group "otros". Every share is a power of two,
// so every angle is exact in binary.
const RAIZ = [
  parte("Capital Humano", 0.5, ["1"]),
  parte("Deuda", 0.25, ["2"]),
  parte("otros", 0.25, ["3", "4"], true),
];
const NIVEL_1 = [parte("Educacion", 0.75, ["1-1"]), parte("Salud", 0.25, ["1-2"])];
const NIVEL_2 = [parte("Becas", 0.5, ["1-1-1"]), parte("Escuelas", 0.5, ["1-1-2"])];
const NIVEL_3 = [parte("Norte", 1, ["1-1-1-1"])];

const nivel = (porciones, elegida = null, hoja = false) => ({ porciones, elegida, hoja });

function cerca(real, esperado, mensaje) {
  assert.ok(Math.abs(real - esperado) < 1e-9, `${mensaje}: ${real} != ${esperado}`);
}

const buscar = (arcos, llave) => arcos.find((arco) => arco.llave === llave);

test("los angulos empiezan a las doce y suman una vuelta", () => {
  const angulos = angulosDe(RAIZ);
  cerca(angulos[0].a0, 0, "the first part starts at 12 o'clock");
  cerca(angulos[0].a1, Math.PI, "half of the total is half a turn");
  cerca(angulos[1].a1, 1.5 * Math.PI, "clockwise, one part after the other");
  cerca(angulos[2].a1, VUELTA, "the parts add up to one turn");
});

test("un cuarto de anillo es un arco afuera, una recta y un arco adentro", () => {
  assert.equal(caminoDeAnillo({ r0: 0.5, r1: 1, a0: 0, a1: Math.PI / 2 }),
    "M0 -1A1 1 0 0 1 1 0L0.5 0A0.5 0.5 0 0 0 0 -0.5Z");
});

test("un arco de mas de media vuelta lleva la bandera del arco grande", () => {
  assert.equal(caminoDeAnillo({ r0: 0.5, r1: 1, a0: 0, a1: 0.6 * VUELTA }),
    "M0 -1A1 1 0 1 1 -0.58779 0.80902L-0.29389 0.40451A0.5 0.5 0 1 0 0 -0.5Z");
});

test("una sola parte dibuja un anillo entero", () => {
  // An arc from a point to the same point draws nothing, so a full turn is
  // two half turns outside and two half turns inside.
  assert.equal(caminoDeAnillo({ r0: 0.44, r1: 0.8, a0: 0, a1: VUELTA }),
    "M0 -0.8A0.8 0.8 0 1 1 0 0.8A0.8 0.8 0 1 1 0 -0.8Z"
    + "M0 -0.44A0.44 0.44 0 1 0 0 0.44A0.44 0.44 0 1 0 0 -0.44Z");
});

test("un arco sin abertura o sin grosor no dibuja nada", () => {
  assert.equal(caminoDeAnillo({ r0: 0.5, r1: 1, a0: 1, a1: 1 }), "");
  assert.equal(caminoDeAnillo({ r0: 0.8, r1: 0.8, a0: 0, a1: 1 }), "");
});

test("los colores empiezan en cada nivel y otros es neutro", () => {
  assert.equal(colorDe(RAIZ[0], 0, 3), "var(--c0)");
  assert.equal(colorDe(RAIZ[1], 1, 3), "var(--c1)");
  assert.equal(colorDe(RAIZ[2], 2, 3), "var(--otros)");
  assert.equal(colorDe(NIVEL_1[0], 0, 2), "var(--c0)", "W14: no hue from the parent");
});

test("la ultima parte no repite el color de la primera", () => {
  // Eight parts and no "otros": the eighth part touches the first one.
  assert.equal(colorDe(parte("Octava", 0.1, ["8"]), 7, 8), "var(--c1)");
  assert.equal(colorDe(parte("Octava", 0.1, ["8"]), 7, 9), "var(--c0)",
    "with a ninth part, the eighth touches no first part");
});

test("la escena de la raiz es un solo anillo que abre cada parte", () => {
  const arcos = escenaDe([nivel(RAIZ)]);
  assert.equal(arcos.length, 3);
  assert.deepEqual(arcos.map((arco) => arco.rol), ["principal", "principal", "principal"]);
  assert.deepEqual(arcos.map((arco) => arco.abrir), [0, 1, 2]);
  assert.deepEqual(arcos.map((arco) => arco.subir), [null, null, null]);
  assert.deepEqual([arcos[0].r0, arcos[0].r1], RADIOS.principal);
});

test("la escena de un nodo enciende el arco del camino en el anillo fino", () => {
  const arcos = escenaDe([nivel(RAIZ, 0), nivel(NIVEL_1)]);
  const principal = arcos.filter((arco) => arco.rol === "principal");
  const previo = arcos.filter((arco) => arco.rol === "previo");
  assert.deepEqual(principal.map((arco) => arco.llave), ["1:1-1", "1:1-2"]);
  assert.equal(previo.length, 3);
  assert.equal(arcos.filter((arco) => arco.rol === "primero").length, 0,
    "the hairline ring starts at depth 2");
  const encendido = buscar(arcos, "0:1");
  assert.equal(encendido.opacidad, 1);
  assert.equal(encendido.subir, 0, "the lit arc goes to the previous level");
  assert.equal(encendido.abrir, null);
  assert.equal(encendido.color, "var(--c0)", "W14: the lit arc keeps its colour");
  const tenue = buscar(arcos, "0:2");
  assert.equal(tenue.opacidad, OPACIDAD_TENUE);
  assert.equal(tenue.subir, null, "W7: a dim arc goes nowhere");
});

test("el anillo fino va al nivel previo y el de un pelo al nivel 1", () => {
  const arcos = escenaDe([
    nivel(RAIZ, 0), nivel(NIVEL_1, 0), nivel(NIVEL_2, 0), nivel(NIVEL_3, null, true),
  ]);
  assert.equal(buscar(arcos, "2:1-1-1").rol, "previo");
  assert.equal(buscar(arcos, "2:1-1-1").subir, 2);
  assert.equal(buscar(arcos, "0:1").rol, "primero");
  assert.equal(buscar(arcos, "0:1").subir, 1);
  assert.equal(arcos.filter((arco) => arco.nivel === 1).length, 0,
    "the rings between level 1 and the previous level do not draw");
});

test("la parte del ultimo nivel no abre nada", () => {
  const arcos = escenaDe([nivel(RAIZ, 0), nivel(NIVEL_3, null, true)]);
  const principal = arcos.filter((arco) => arco.rol === "principal");
  assert.equal(principal.length, 1);
  assert.equal(principal[0].abrir, null);
  cerca(principal[0].a1, VUELTA, "one part is one full ring");
});

test("bajar empieza en la escena de antes y termina en la de despues", () => {
  const antes = escenaDe([nivel(RAIZ)]);
  const despues = escenaDe([nivel(RAIZ, 0), nivel(NIVEL_1)]);
  const paso = interpolar(antes, despues);

  const alInicio = paso(0);
  const tocada = buscar(alInicio, "0:1");
  assert.deepEqual([tocada.r0, tocada.r1], RADIOS.principal);
  cerca(tocada.a1, Math.PI, "the tapped part starts where it was");
  const hija = buscar(alInicio, "1:1-1");
  assert.deepEqual([hija.r0, hija.r1], RADIOS.principal);
  cerca(hija.a0, 0, "the child is born inside the angle of its parent");
  cerca(hija.a1, 0.75 * Math.PI, "75% of a part of half a turn");

  const alFinal = paso(1);
  cerca(buscar(alFinal, "0:1").r0, RADIOS.previo[0], "the old main ring moves out");
  cerca(buscar(alFinal, "0:1").r1, RADIOS.previo[1], "and it gets thin");
  cerca(buscar(alFinal, "1:1-1").a1, 1.5 * Math.PI, "the child fills its share of the ring");
  assert.ok(alFinal.every((arco) => arco.abrir === null && arco.subir === null),
    "an arc in motion carries no destination");
});

test("subir es el mismo movimiento al reves", () => {
  const antes = escenaDe([nivel(RAIZ, 0), nivel(NIVEL_1)]);
  const despues = escenaDe([nivel(RAIZ)]);
  const alFinal = interpolar(antes, despues)(1);
  const hija = buscar(alFinal, "1:1-1");
  cerca(hija.a1, 0.75 * Math.PI, "the child goes back into the angle of its parent");
  cerca(hija.r1, RADIOS.principal[1], "at the radii of the main ring");
  cerca(buscar(alFinal, "0:1").r0, RADIOS.principal[0], "the parent is the main ring again");
});

test("en la primera carga el anillo crece desde las doce", () => {
  const arcos = escenaDe([nivel(RAIZ)]);
  const mitad = interpolar(desdeCero(arcos), arcos)(0.5);
  cerca(mitad[0].a1, Math.PI / 2, "half of the motion, half of the angle");
  cerca(mitad[1].a0, Math.PI / 2, "every arc grows from 12 o'clock");
});

test("el svg da un area de toque y un destino a cada arco que navega", () => {
  const svg = svgDeEscena(escenaDe([nivel(RAIZ, 0), nivel(NIVEL_1)]));
  // Two parts of the main ring and one lit arc navigate. The two dim arcs
  // of the thin ring do not.
  assert.equal(svg.match(/class="golpe"/g).length, 3);
  assert.equal(svg.match(/data-abrir="\d"/g).length, 4, "a hit area and an arc per part");
  assert.equal(svg.match(/data-subir="0"/g).length, 2);
  assert.equal(svg.match(/ ciego"/g).length, 2);
  assert.match(svg, /vector-effect="non-scaling-stroke"/, "R3: the hit area is in screen pixels");
});

test("un nivel sin partes dibuja un anillo vacio", () => {
  const svg = svgDeEscena(escenaDe([nivel([])]));
  assert.ok(svg.startsWith('<path class="contorno"'));
});
```

- [ ] **Step 2: Run the test and see it fail**

Run: `node --test test/anillos.test.mjs`
Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Write the implementation**

Create `site/app/anillos.js`:

```javascript
// The rings of the chart, as pure geometry.
//
// The disc in the center shows the amount of the nodo. The main ring holds
// the parts of the nodo. The thin ring shows the previous level, and the
// hairline ring shows level 1. Only a lit arc of an outer ring navigates.
//
// The SVG uses a viewBox of -1 -1 2 2, so a radius of 1 touches the edge.
// An angle starts at 12 o'clock and grows clockwise. This module touches no
// DOM, so a test reads every number.

export const VUELTA = Math.PI * 2;

export const RADIOS = {
  principal: [0.44, 0.80],
  previo: [0.845, 0.895],
  primero: [0.94, 0.955],
};

export const RADIO_DEL_DISCO = RADIOS.principal[0];
export const OPACIDAD_TENUE = 0.28;

const COLORES = 7;

export function colorDe(porcion, orden, cantidad) {
  // W14: the colours restart at every level, by size. "otros" is always
  // neutral. porcionesDe sorts the parts by size and puts "otros" last.
  if (porcion.esOtros) {
    return "var(--otros)";
  }
  let indice = orden % COLORES;
  // The last part touches the first part of the ring. With 8 or 15 parts
  // and no "otros", both would take --c0, and the two arcs would look like
  // one arc.
  if (orden > 0 && orden === cantidad - 1 && indice === 0) {
    indice = 1;
  }
  return `var(--c${indice})`;
}

export function angulosDe(porciones) {
  let angulo = 0;
  return porciones.map((porcion) => {
    const a0 = angulo;
    angulo += porcion.parte * VUELTA;
    return { a0, a1: angulo };
  });
}

// Five decimals are enough for a viewBox of 2 units. Number() drops the
// trailing zeros and turns -0 into 0, so a test can write the path by hand.
function numero(valor) {
  return String(Number(valor.toFixed(5)));
}

function punto(radio, angulo) {
  return `${numero(radio * Math.sin(angulo))} ${numero(-radio * Math.cos(angulo))}`;
}

export function caminoDeAnillo({ r0, r1, a0, a1 }) {
  const abertura = a1 - a0;
  if (abertura <= 0 || r1 <= r0) {
    return "";
  }
  const [interior, exterior] = [numero(r0), numero(r1)];
  if (abertura >= VUELTA - 1e-9) {
    // An SVG arc from a point to the same point draws nothing. A full ring
    // is two half turns outside, clockwise, and two half turns inside,
    // counterclockwise. The opposite directions leave the hole empty.
    return `M0 ${numero(-r1)}A${exterior} ${exterior} 0 1 1 0 ${exterior}`
      + `A${exterior} ${exterior} 0 1 1 0 ${numero(-r1)}Z`
      + `M0 ${numero(-r0)}A${interior} ${interior} 0 1 0 0 ${interior}`
      + `A${interior} ${interior} 0 1 0 0 ${numero(-r0)}Z`;
  }
  const grande = abertura > Math.PI ? 1 : 0;
  return `M${punto(r1, a0)}A${exterior} ${exterior} 0 ${grande} 1 ${punto(r1, a1)}`
    + `L${punto(r0, a1)}A${interior} ${interior} 0 ${grande} 0 ${punto(r0, a0)}Z`;
}

function llaveDe(nivel, porcion) {
  return `${nivel}:${porcion.destino.join("|")}`;
}

export function escenaDe(pila) {
  // pila holds one level per screen from the root to the screen on view:
  // { porciones, elegida, hoja }. elegida is the order of the part that
  // leads to the next level, or null on the last level.
  const arcos = [];
  const cantidad = pila.length;

  function anillo(nivel, rol, subir) {
    const { porciones, elegida, hoja } = pila[nivel];
    const angulos = angulosDe(porciones);
    const arriba = pila[nivel - 1];
    const padre = arriba && arriba.elegida !== null
      ? llaveDe(nivel - 1, arriba.porciones[arriba.elegida])
      : null;
    porciones.forEach((porcion, orden) => {
      const encendido = rol !== "principal" && orden === elegida;
      arcos.push({
        llave: llaveDe(nivel, porcion),
        nivel,
        rol,
        padre,
        orden,
        color: colorDe(porcion, orden, porciones.length),
        r0: RADIOS[rol][0],
        r1: RADIOS[rol][1],
        a0: angulos[orden].a0,
        a1: angulos[orden].a1,
        opacidad: rol === "principal" || encendido ? 1 : OPACIDAD_TENUE,
        // A part of the last level has no child to open.
        abrir: rol === "principal" && !hoja ? orden : null,
        // W7: only a lit arc navigates. A dim arc carries no destination.
        subir: encendido ? subir : null,
      });
    });
  }

  anillo(cantidad - 1, "principal", null);
  if (cantidad >= 2) {
    // A12: the lit arc of the thin ring goes to the previous level.
    anillo(cantidad - 2, "previo", cantidad - 2);
  }
  if (cantidad >= 3) {
    // A13: the lit arc of the hairline ring goes to level 1.
    anillo(0, "primero", 1);
  }
  return arcos;
}

function fantasma(arco, otra) {
  // An arc with no partner in the other scene lives inside the arc of its
  // parent there. A child is born inside the angle of the tapped part, and
  // it goes back into that angle on the way up.
  const padre = otra.find((candidato) => candidato.llave === arco.padre);
  if (!padre) {
    return { ...arco, opacidad: 0 };
  }
  const escala = (padre.a1 - padre.a0) / VUELTA;
  return {
    ...arco,
    a0: padre.a0 + arco.a0 * escala,
    a1: padre.a0 + arco.a1 * escala,
    r0: padre.r0,
    r1: padre.r1,
  };
}

function mezcla(desde, hasta, t) {
  return desde + (hasta - desde) * t;
}

export function interpolar(desde, hasta) {
  // R4: pair every arc by its llave. The same llave in both scenes moves
  // from one ring to the other. The rest are born or die inside a parent.
  const pares = new Map();
  for (const arco of desde) {
    pares.set(arco.llave, [arco, null]);
  }
  for (const arco of hasta) {
    const par = pares.get(arco.llave);
    if (par) {
      par[1] = arco;
    } else {
      pares.set(arco.llave, [fantasma(arco, desde), arco]);
    }
  }
  for (const par of pares.values()) {
    if (!par[1]) {
      par[1] = fantasma(par[0], hasta);
    }
  }
  const lista = [...pares.values()];
  // An arc in motion carries no destination: a tap ends the motion first.
  return (t) => lista.map(([uno, otro]) => ({
    ...otro,
    r0: mezcla(uno.r0, otro.r0, t),
    r1: mezcla(uno.r1, otro.r1, t),
    a0: mezcla(uno.a0, otro.a0, t),
    a1: mezcla(uno.a1, otro.a1, t),
    opacidad: mezcla(uno.opacidad, otro.opacidad, t),
    abrir: null,
    subir: null,
  }));
}

export function desdeCero(arcos) {
  // W4: on the first load the main ring grows once from 12 o'clock.
  return arcos.map((arco) => ({ ...arco, a0: 0, a1: 0 }));
}

function accionDe(arco) {
  if (arco.abrir !== null) {
    return `data-abrir="${arco.abrir}"`;
  }
  if (arco.subir !== null) {
    return `data-subir="${arco.subir}"`;
  }
  return "";
}

export function svgDeEscena(arcos) {
  // The markup holds numbers and colour tokens only, never a name from the
  // data, so innerHTML is safe here.
  const vivos = arcos.filter((arco) => arco.opacidad > 0.005);
  const contorno = vivos.some((arco) => arco.rol === "principal")
    ? ""
    : `<path class="contorno" d="${caminoDeAnillo({
      r0: RADIOS.principal[0], r1: RADIOS.principal[1], a0: 0, a1: VUELTA,
    })}"></path>`;
  // R3: a transparent stroke of 24px under every arc that navigates. The
  // thin rings are about 12px wide on a telephone.
  const golpes = vivos.filter(accionDe).map((arco) => `<path class="golpe" `
    + `d="${caminoDeAnillo(arco)}" vector-effect="non-scaling-stroke" `
    + `${accionDe(arco)}></path>`);
  const formas = vivos.map((arco) => `<path class="arco${accionDe(arco) ? "" : " ciego"}" `
    + `d="${caminoDeAnillo(arco)}" style="fill:${arco.color}" `
    + `fill-opacity="${arco.opacidad.toFixed(3)}" ${accionDe(arco)}></path>`);
  return contorno + golpes.join("") + formas.join("");
}
```

- [ ] **Step 4: Run the tests and see them pass**

Run: `node --test test/anillos.test.mjs`
Expected: PASS, 16 tests.

Run: `node --test`
Expected: PASS, 122 tests, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add site/app/anillos.js test/anillos.test.mjs
git commit -F - <<'EOF'
Add the geometry of the rings of the chart

The rings replace the pie chart. The scene lights the path in the outer
rings, and the motion ports the prototype: a tapped arc widens into the
main ring, and its children are born inside its angle.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```


---

### Task 2: The short breadcrumb

R9 changes the breadcrumb to `Inicio › <level 1> › … › <previous>`. The title names the nodo on screen, so the breadcrumb never does. Two names that differ only in accents or case are one crumb. The input is the list of names of the pila, which Task 8 builds: one name per screen, from the root to the screen on view.

**Files:**
- Modify: `site/app/arbol.js`
- Test: `test/arbol.test.mjs`

**Interfaces:**
- Consumes: nothing new.
- Produces:
  - `llano(nombre) -> string`: the name with no accent, in lower case.
  - `migaCorta(nombres: string[]) -> Array<{ nivel, nombre } | { ocultos: Array<{ nivel, nombre }> }>`. `nivel` is the index in the pila. Level 0 is always named "Inicio". A group `{ ocultos }` is the crumb "…".


- [ ] **Step 1: Write the failing test**

In `test/arbol.test.mjs`, replace this text:

```javascript
  hijosDe, migaDePan, nivelDe, raices, saltarHijoUnico, totalDe,
```

with:

```javascript
  hijosDe, llano, migaCorta, migaDePan, nivelDe, raices, saltarHijoUnico, totalDe,
```

Append to the end of `test/arbol.test.mjs`:

```javascript
const CAMINO = [
  "", "Ministerio de Capital Humano", "Secretaría de Educación",
  "Desarrollo de la Educación Superior", "Becas", "Becas Progresar", "Norte",
];

const miga = (profundidad) => migaCorta(CAMINO.slice(0, profundidad + 1));

test("la raiz no tiene miga y el nivel 1 solo tiene Inicio", () => {
  assert.deepEqual(miga(0), []);
  assert.deepEqual(miga(1), [{ nivel: 0, nombre: "Inicio" }]);
});

test("la miga nombra el nivel 1 y el previo, y nunca el actual", () => {
  assert.deepEqual(miga(2), [
    { nivel: 0, nombre: "Inicio" },
    { nivel: 1, nombre: "Ministerio de Capital Humano" },
  ]);
  assert.deepEqual(miga(3), [
    { nivel: 0, nombre: "Inicio" },
    { nivel: 1, nombre: "Ministerio de Capital Humano" },
    { nivel: 2, nombre: "Secretaría de Educación" },
  ]);
});

test("los niveles del medio van detras de los puntos suspensivos", () => {
  assert.deepEqual(miga(4), [
    { nivel: 0, nombre: "Inicio" },
    { nivel: 1, nombre: "Ministerio de Capital Humano" },
    { ocultos: [{ nivel: 2, nombre: "Secretaría de Educación" }] },
    { nivel: 3, nombre: "Desarrollo de la Educación Superior" },
  ]);
  assert.deepEqual(miga(6).map((tramo) => tramo.nombre ?? tramo.ocultos.length),
    ["Inicio", "Ministerio de Capital Humano", 3, "Becas Progresar"]);
  assert.deepEqual(miga(5)[2].ocultos.map((tramo) => tramo.nivel), [2, 3]);
});

test("dos nombres que difieren en acentos o mayusculas son un tramo", () => {
  const nombres = ["", "SALUD", "Salud", "Educacion", "Educación", "Becas"];
  // "SALUD" joins "Salud", and "Educacion" joins "Educación". The deeper
  // crumb stays, because it points nearer to the screen on view.
  assert.deepEqual(migaCorta(nombres), [
    { nivel: 0, nombre: "Inicio" },
    { nivel: 2, nombre: "Salud" },
    { nivel: 4, nombre: "Educación" },
  ]);
  assert.equal(llano("Educación"), llano("EDUCACION"));
});

test("el nivel previo queda aunque se llame como la pantalla", () => {
  assert.deepEqual(migaCorta(["", "Defensa", "Defensa"]).map((tramo) => tramo.nivel),
    [0, 1]);
});
```

- [ ] **Step 2: Run the test and see it fail**

Run: `node --test test/arbol.test.mjs`
Expected: FAIL with `SyntaxError: The requested module '../site/app/arbol.js' does not provide an export named 'llano'`.

- [ ] **Step 3: Write the implementation**

Append to the end of `site/app/arbol.js`:

```javascript
export function llano(nombre) {
  // DGSIAF writes one name with and without accents, and in two cases:
  // "Educacion" and "Educación". A reader sees one name.
  return nombre.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

export function migaCorta(nombres) {
  // R9: Inicio › <level 1> › … › <previous>. nombres holds one name per
  // screen, from the root to the screen on view. The title names the screen
  // on view, so the breadcrumb never does.
  const actual = nombres.length - 1;
  const niveles = [];
  for (let nivel = 0; nivel < actual; nivel += 1) {
    // Two neighbours with one name are one crumb. The deeper one stays,
    // because it is nearer to the screen on view. The previous level stays.
    const repetido = nivel > 0 && nivel + 1 < actual
      && llano(nombres[nivel]) === llano(nombres[nivel + 1]);
    if (!repetido) {
      niveles.push({ nivel, nombre: nivel === 0 ? "Inicio" : nombres[nivel] });
    }
  }
  if (niveles.length < 4) {
    return niveles;
  }
  // "…" holds every level between level 1 and the previous level.
  return [niveles[0], niveles[1], { ocultos: niveles.slice(2, -1) }, niveles.at(-1)];
}
```

- [ ] **Step 4: Run the tests and see them pass**

Run: `node --test test/arbol.test.mjs`
Expected: PASS, 13 tests.

Run: `node --test`
Expected: PASS, 127 tests, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add site/app/arbol.js test/arbol.test.mjs
git commit -F - <<'EOF'
Add the short breadcrumb

The breadcrumb names the root, level 1 and the previous level. The
levels between them wait behind one crumb. Two names that differ only in
accents or case are one crumb.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```


---

### Task 3: The sentence of "Billetes"

R15 adds one sentence to the view "Billetes": "De cada $100 que gastó <nodo> en <año>, $<n> fueron a <parte mayor>." W15 keeps "en forma directa" when the largest part has the name of the nodo. A nodo with no part compares itself with the national total. The amount comes back as its own piece, so the screen writes it in bold with `textContent`.

**Files:**
- Create: `site/app/frase.js`
- Test: `test/frase.test.mjs`

**Interfaces:**
- Consumes: `llano` (Task 2).
- Produces:
  - `NODO_DE_LA_RAIZ = "el Estado nacional"`.
  - `deCadaCien(parte) -> "$<n>" | "<n> centavos" | "1 centavo" | "menos de 1 centavo"`.
  - `fraseDe({ anio, nodo, porciones, total, totalNacional }) -> { antes, cifra, despues }`. `nodo` is `null` at the root. `total` and `totalNacional` are in millions of pesos.


- [ ] **Step 1: Write the failing test**

Create `test/frase.test.mjs`:

```javascript
import test from "node:test";
import assert from "node:assert/strict";

import { deCadaCien, fraseDe } from "../site/app/frase.js";

const parte = (nombre, monto, total, esOtros = false) => ({
  nombre, monto, parte: monto / total, esOtros, destino: [nombre],
});

const leer = ({ antes, cifra, despues }) => `${antes}${cifra}${despues}`;

test("en la raiz el nodo es el Estado nacional", () => {
  const frase = fraseDe({
    anio: 2025,
    nodo: null,
    porciones: [parte("Ministerio de Capital Humano", 59.8, 100), parte("Deuda", 40.2, 100)],
    total: 100,
    totalNacional: 100,
  });
  assert.equal(frase.cifra, "$60", "59,8 rounds to 60");
  assert.equal(leer(frase),
    "De cada $100 que gastó el Estado nacional en 2025, $60 fueron a Ministerio de Capital Humano.");
});

test("la parte mayor con el nombre del nodo lo gasto en forma directa", () => {
  const frase = fraseDe({
    anio: 2025,
    nodo: "Secretaría de Educación",
    porciones: [parte("Secretaria de Educacion", 78, 100), parte("Becas", 22, 100)],
    total: 100,
    totalNacional: 1000,
  });
  assert.equal(leer(frase),
    "De cada $100 que gastó Secretaría de Educación en 2025, $78 los gastó "
    + "Secretaría de Educación en forma directa.");
});

test("un nodo sin partes se compara con el total nacional", () => {
  const frase = fraseDe({
    anio: 2024, nodo: "Becas", porciones: [], total: 0.5, totalNacional: 100,
  });
  // 0,5 of 100 is 0,5%: 50 centavos of every $100.
  assert.equal(leer(frase),
    "De cada $100 que gastó el Estado nacional en 2024, 50 centavos fueron a Becas.");
});

test("otros puede ser la parte mayor aunque vaya al final", () => {
  const frase = fraseDe({
    anio: 2025,
    nodo: "Vialidad",
    porciones: [parte("Rutas", 5, 100), parte("otros", 95, 100, true)],
    total: 100,
    totalNacional: 1000,
  });
  assert.equal(frase.cifra, "$95");
  assert.equal(frase.despues, " fueron a otros gastos chicos.");
});

test("menos de un peso se dice en centavos", () => {
  assert.equal(deCadaCien(0.0099), "99 centavos");
  assert.equal(deCadaCien(0.0001), "1 centavo");
  assert.equal(deCadaCien(0.00995), "$1", "99,5 centavos round to one peso");
  assert.equal(deCadaCien(0.00001), "menos de 1 centavo");
  assert.equal(deCadaCien(0), "menos de 1 centavo");
});
```

- [ ] **Step 2: Run the test and see it fail**

Run: `node --test test/frase.test.mjs`
Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Write the implementation**

Create `site/app/frase.js`:

```javascript
// The sentence of the view "Billetes" (R15).
//
// "De cada $100 que gastó <nodo> en <año>, $<n> fueron a <parte mayor>."
// The sentence comes back in three pieces, so the screen writes the amount
// in bold with textContent and never parses a name from the data as HTML.

import { llano } from "./arbol.js";

export const NODO_DE_LA_RAIZ = "el Estado nacional";

export function deCadaCien(parte) {
  const centavos = parte * 10000;
  if (centavos < 1) {
    return "menos de 1 centavo";
  }
  const redondo = Math.round(centavos);
  if (redondo < 100) {
    return redondo === 1 ? "1 centavo" : `${redondo} centavos`;
  }
  return `$${Math.round(parte * 100)}`;
}

export function fraseDe({ anio, nodo, porciones, total, totalNacional }) {
  // nodo is null at the root.
  const quien = nodo ?? NODO_DE_LA_RAIZ;
  if (porciones.length === 0) {
    // A nodo with no part to show: compare it with the national total.
    const parte = totalNacional > 0 ? total / totalNacional : 0;
    return {
      antes: `De cada $100 que gastó ${NODO_DE_LA_RAIZ} en ${anio}, `,
      cifra: deCadaCien(parte),
      despues: ` fueron a ${quien}.`,
    };
  }
  // "otros" goes last in the list, and it can still be the largest part.
  const mayor = porciones.reduce((uno, otro) => (otro.monto > uno.monto ? otro : uno));
  const antes = `De cada $100 que gastó ${quien} en ${anio}, `;
  const cifra = deCadaCien(mayor.parte);
  if (!mayor.esOtros && nodo !== null && llano(mayor.nombre) === llano(nodo)) {
    // W15: DGSIAF repeats the name of the parent on its largest child.
    return { antes, cifra, despues: ` los gastó ${quien} en forma directa.` };
  }
  const destino = mayor.esOtros ? "otros gastos chicos" : mayor.nombre;
  return { antes, cifra, despues: ` fueron a ${destino}.` };
}
```

- [ ] **Step 4: Run the tests and see them pass**

Run: `node --test test/frase.test.mjs`
Expected: PASS, 5 tests.

Run: `node --test`
Expected: PASS, 132 tests, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add site/app/frase.js test/frase.test.mjs
git commit -F - <<'EOF'
Add the sentence of the view Billetes

The sentence says how many pesos of every 100 went to the largest part.
Under one peso it says centavos, and under one centavo it says so.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```


---

### Task 4: The text of the disc

R7 puts two lines in the disc: the number, large, and the unit, small. The size of the number follows the inner radius, with a margin of 12% of that radius. The browser measures the text at 100px, and one division gives the size that fits. Task 11 calls the fit in the browser.

**Files:**
- Modify: `site/app/formato.js`, `site/app/anillos.js`
- Test: `test/formato.test.mjs`, `test/anillos.test.mjs`

**Interfaces:**
- Consumes: `montoCorto` of `formato.js`.
- Produces:
  - `partesDelMonto(millones) -> { numero, unidad }`. `unidad` is `"billones"`, `"millones"` or `"pesos"`.
  - `MARGEN_DEL_DISCO = 0.12`.
  - `tamanioDelDisco({ ancho, alto, radio, referencia = 100, maximo = 56 }) -> number | null`. `ancho` and `alto` are the size of the text block at `referencia` px. `radio` is the inner radius in px. `null` when the block has no size.


- [ ] **Step 1: Write the failing tests**

In `test/formato.test.mjs`, replace this text:

```javascript
  conSigno, fechaCorta, montoCorto, montoLargo, pesosDe, porcentaje,
```

with:

```javascript
  conSigno, fechaCorta, montoCorto, montoLargo, partesDelMonto, pesosDe, porcentaje,
```

Append to the end of `test/formato.test.mjs`:

```javascript
test("el disco separa el numero de la unidad", () => {
  assert.deepEqual(partesDelMonto(123_533_955.013701), { numero: "123,5", unidad: "billones" });
  assert.deepEqual(partesDelMonto(1.2), { numero: "1,2", unidad: "millones" });
  assert.deepEqual(partesDelMonto(0.5), { numero: "500.000", unidad: "pesos" });
});
```

In `test/anillos.test.mjs`, replace this text:

```javascript
  OPACIDAD_TENUE, RADIOS, svgDeEscena, VUELTA,
```

with:

```javascript
  OPACIDAD_TENUE, RADIOS, svgDeEscena, tamanioDelDisco, VUELTA,
```

Append to the end of `test/anillos.test.mjs`:

```javascript
test("el texto del disco entra en el agujero con un margen del 12%", () => {
  // A block of 300 by 400 px at 100 px has a diagonal of 500 px. A radius
  // of 100 px leaves a circle of 176 px across, so 100 * 176 / 500 = 35.2.
  cerca(tamanioDelDisco({ ancho: 300, alto: 400, radio: 100 }), 35.2, "the size");
  assert.equal(tamanioDelDisco({ ancho: 300, alto: 400, radio: 1000 }), 56, "a cap");
  assert.equal(tamanioDelDisco({ ancho: 0, alto: 0, radio: 100 }), null,
    "a block that is not on screen has no size");
});
```

- [ ] **Step 2: Run the tests and see them fail**

Run: `node --test test/formato.test.mjs`
Expected: FAIL with `SyntaxError: The requested module '../site/app/formato.js' does not provide an export named 'partesDelMonto'`.

Run: `node --test test/anillos.test.mjs`
Expected: FAIL with `SyntaxError: The requested module '../site/app/anillos.js' does not provide an export named 'tamanioDelDisco'`.

- [ ] **Step 3: Write the implementation**

Append to the end of `site/app/formato.js`:

```javascript
export function partesDelMonto(millones) {
  // R7: the disc writes the number large and the unit small, on two lines.
  // montoCorto writes no unit under a million pesos, so the unit is "pesos".
  const [numero, unidad = "pesos"] = montoCorto(millones).split(" ");
  return { numero, unidad };
}
```

In `site/app/anillos.js`, replace this text:

```javascript
export const OPACIDAD_TENUE = 0.28;
```

with:

```javascript
export const OPACIDAD_TENUE = 0.28;
export const MARGEN_DEL_DISCO = 0.12;
```

Append to the end of `site/app/anillos.js`:

```javascript
export function tamanioDelDisco({ ancho, alto, radio, referencia = 100, maximo = 56 }) {
  // R7: the text of the disc is measured at a reference size. The size is
  // linear in the font size, so one division gives the size whose corners
  // touch a circle of 88% of the inner radius.
  const diagonal = Math.hypot(ancho, alto);
  if (!diagonal || !radio) {
    return null;
  }
  return Math.min(maximo, (referencia * 2 * radio * (1 - MARGEN_DEL_DISCO)) / diagonal);
}
```

- [ ] **Step 4: Run the tests and see them pass**

Run: `node --test test/formato.test.mjs`
Expected: PASS, 8 tests.

Run: `node --test test/anillos.test.mjs`
Expected: PASS, 17 tests.

Run: `node --test`
Expected: PASS, 134 tests, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add site/app/formato.js test/formato.test.mjs site/app/anillos.js test/anillos.test.mjs
git commit -F - <<'EOF'
Fit the amount of the disc inside the hole of the rings

The disc writes the number and the unit on two lines. The size of the
number keeps a margin of 12% of the inner radius.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```


---

### Task 5: The two switches of the look

"Oscuro" (R13) and "Billetes" (R14) change two attributes on `<html>`: `data-tema` (`"claro"`, `"oscuro"`) and `data-vista` (`"simple"`, `"billetes"`). The first value of "Oscuro" comes from `prefers-color-scheme`. The choice goes to `localStorage`. A storage that throws keeps the look for this visit only (UC-09).

**Files:**
- Create: `site/app/tema.js`
- Test: `test/tema.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `CLAVE_OSCURO = "enquelagastan-oscuro"`, `CLAVE_BILLETES = "enquelagastan-billetes"`. Task 12 uses the same two strings in the inline script of `index.html`, and a test checks that.
  - `leerTema(almacen, prefiere) -> { oscuro, billetes }`. `almacen` is a `Storage` or `null`. `prefiere(consulta) -> boolean` answers a media query.
  - `aplicarTema(documento, tema)`: sets `data-tema` and `data-vista` on `documento.documentElement`, and `aria-checked` on `#oscuro` and `#billetes`.
  - `cambiarTema(tema, interruptor, almacen) -> tema`. `interruptor` is `"oscuro"` or `"billetes"`.


- [ ] **Step 1: Write the failing test**

Create `test/tema.test.mjs`:

```javascript
import test from "node:test";
import assert from "node:assert/strict";

import {
  aplicarTema, cambiarTema, CLAVE_BILLETES, CLAVE_OSCURO, leerTema,
} from "../site/app/tema.js";

function almacen(datos = {}) {
  return {
    datos,
    getItem: (clave) => datos[clave] ?? null,
    setItem: (clave, valor) => { datos[clave] = valor; },
  };
}

const roto = {
  getItem() { throw new Error("SecurityError"); },
  setItem() { throw new Error("QuotaExceededError"); },
};

const oscuroPreferido = (consulta) => consulta === "(prefers-color-scheme: dark)";
const claroPreferido = () => false;

test("sin valor guardado el oscuro sigue la preferencia del sistema", () => {
  assert.deepEqual(leerTema(almacen(), oscuroPreferido), { oscuro: true, billetes: false });
  assert.deepEqual(leerTema(almacen(), claroPreferido), { oscuro: false, billetes: false });
});

test("un valor guardado gana a la preferencia del sistema", () => {
  const guardado = almacen({ [CLAVE_OSCURO]: "false", [CLAVE_BILLETES]: "true" });
  assert.deepEqual(leerTema(guardado, oscuroPreferido), { oscuro: false, billetes: true });
});

test("un almacen que falla da el aspecto por defecto", () => {
  assert.deepEqual(leerTema(roto, claroPreferido), { oscuro: false, billetes: false });
  // The getter of window.localStorage can throw too. app.js then passes null.
  assert.deepEqual(leerTema(null, oscuroPreferido), { oscuro: true, billetes: false });
});

function elemento() {
  return { atributos: {}, setAttribute(nombre, valor) { this.atributos[nombre] = valor; } };
}

test("el aspecto vive en dos atributos de html y en los dos interruptores", () => {
  const partes = { html: elemento(), oscuro: elemento(), billetes: elemento() };
  const documento = { documentElement: partes.html, getElementById: (id) => partes[id] };
  aplicarTema(documento, { oscuro: true, billetes: false });
  assert.deepEqual(partes.html.atributos, { "data-tema": "oscuro", "data-vista": "simple" });
  assert.equal(partes.oscuro.atributos["aria-checked"], "true");
  assert.equal(partes.billetes.atributos["aria-checked"], "false");
  aplicarTema(documento, { oscuro: false, billetes: true });
  assert.deepEqual(partes.html.atributos, { "data-tema": "claro", "data-vista": "billetes" });
});

test("un interruptor guarda la eleccion, y un almacen que falla no rompe", () => {
  const lugar = almacen();
  const tema = cambiarTema({ oscuro: false, billetes: false }, "billetes", lugar);
  assert.deepEqual(tema, { oscuro: false, billetes: true });
  assert.equal(lugar.datos[CLAVE_BILLETES], "true");
  assert.deepEqual(cambiarTema(tema, "oscuro", roto), { oscuro: true, billetes: true },
    "the look changes for this visit");
});
```

- [ ] **Step 2: Run the test and see it fail**

Run: `node --test test/tema.test.mjs`
Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Write the implementation**

Create `site/app/tema.js`:

```javascript
// The two switches of the look: "Oscuro" (R13) and "Billetes" (R14).
//
// The look lives in two attributes on <html>, data-tema and data-vista, and
// estilo.css picks the tokens from them. A switch changes the look and never
// the place, so it writes no history entry (W9).
//
// The inline script of index.html applies the stored look before the first
// paint. It reads the same two keys, and a test checks that.

export const CLAVE_OSCURO = "enquelagastan-oscuro";
export const CLAVE_BILLETES = "enquelagastan-billetes";

const CONSULTA_OSCURA = "(prefers-color-scheme: dark)";

function leer(almacen, clave) {
  // A private window or a blocked site can refuse the storage. The look then
  // falls back to the default, and nothing breaks.
  try {
    return almacen.getItem(clave);
  } catch {
    return null;
  }
}

export function leerTema(almacen, prefiere) {
  const oscuro = leer(almacen, CLAVE_OSCURO);
  return {
    oscuro: oscuro === null ? Boolean(prefiere(CONSULTA_OSCURA)) : oscuro === "true",
    billetes: leer(almacen, CLAVE_BILLETES) === "true",
  };
}

export function aplicarTema(documento, tema) {
  const raiz = documento.documentElement;
  raiz.setAttribute("data-tema", tema.oscuro ? "oscuro" : "claro");
  raiz.setAttribute("data-vista", tema.billetes ? "billetes" : "simple");
  // A switch says its state to a screen reader.
  for (const interruptor of ["oscuro", "billetes"]) {
    documento.getElementById(interruptor)?.setAttribute("aria-checked", String(tema[interruptor]));
  }
}

export function cambiarTema(tema, interruptor, almacen) {
  // interruptor is "oscuro" or "billetes".
  const nuevo = { ...tema, [interruptor]: !tema[interruptor] };
  const clave = interruptor === "oscuro" ? CLAVE_OSCURO : CLAVE_BILLETES;
  try {
    almacen.setItem(clave, String(nuevo[interruptor]));
  } catch {
    // The look still changes. It lasts for this visit only.
  }
  return nuevo;
}
```

- [ ] **Step 4: Run the tests and see them pass**

Run: `node --test test/tema.test.mjs`
Expected: PASS, 5 tests.

Run: `node --test`
Expected: PASS, 139 tests, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add site/app/tema.js test/tema.test.mjs
git commit -F - <<'EOF'
Add the switches Oscuro and Billetes

The look lives in two attributes on the html element. The first dark
value follows the system, and the choice goes to the storage. A storage
that refuses writes keeps the look for one visit.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```


---

### Task 6: The motion runner and the odometer

One loop runs on `requestAnimationFrame`. A new motion ends the running one at once, and the old motion draws its last frame first (R4). The loop takes the frame function and the clock as arguments, so a test drives the time. With no frame function, a motion draws its end at once: the tests of `app.js` use that. The odometer of R5 turns a wheel only while the wheel below goes from 9 to 0.

**Files:**
- Create: `site/app/movimiento.js`
- Test: `test/movimiento.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `DURACION = 500`, `DURACION_REDUCIDA = 150`, `ALTO_DE_CIFRA = 1.2` (em).
  - `curvaBezier(x1, y1, x2, y2) -> (x) => y`, and `suavizar = curvaBezier(0.23, 1, 0.32, 1)`.
  - `crearMotor({ cuadro, ahora } = {}) -> { animar({ duracion = DURACION, reducido = false, paso, fin }), terminar(), activo() }`. `paso(t)` gets the eased progress from 0 to 1. With `reducido`, the motion lasts 150ms and `t` is linear.
  - `ruedasDelOdometro(valor, cantidad) -> [{ posicion, visible }]`, from the largest wheel.
  - `cifrasDe(valor) -> number`, the count of digits of the rounded value.
  - `htmlDelOdometro(ruedas) -> string`, with a dot every three digits.


- [ ] **Step 1: Write the failing test**

Create `test/movimiento.test.mjs`:

```javascript
import test from "node:test";
import assert from "node:assert/strict";

import {
  cifrasDe, crearMotor, DURACION, htmlDelOdometro, ruedasDelOdometro, suavizar,
} from "../site/app/movimiento.js";

// A clock that moves only when the test says so.
function reloj() {
  const cola = [];
  let tiempo = 0;
  return {
    cuadro: (funcion) => { cola.push(funcion); },
    ahora: () => tiempo,
    avanzar(ms) {
      tiempo += ms;
      for (const funcion of cola.splice(0)) {
        funcion(tiempo);
      }
    },
  };
}

test("un paso dura entre 450 y 550 ms", () => {
  assert.ok(DURACION >= 450 && DURACION <= 550);
});

test("la curva es cubic-bezier(0.23, 1, 0.32, 1)", () => {
  assert.equal(suavizar(0), 0);
  assert.equal(suavizar(1), 1);
  // The value of the CSS curve at half the time, from a bisection of 200
  // steps outside this module. A curve of 1 - (1 - t)^4 gives 0.9375 here.
  assert.ok(Math.abs(suavizar(0.5) - 0.96598) < 1e-5, String(suavizar(0.5)));
  assert.ok(Math.abs(suavizar(0.1) - 0.39812) < 1e-5, String(suavizar(0.1)));
});

test("el motor sigue el reloj y termina en uno", () => {
  const tiempo = reloj();
  const motor = crearMotor(tiempo);
  const pasos = [];
  let fines = 0;
  motor.animar({ duracion: 500, paso: (t) => pasos.push(t), fin: () => { fines += 1; } });
  tiempo.avanzar(250);
  assert.ok(Math.abs(pasos.at(-1) - suavizar(0.5)) < 1e-12);
  assert.equal(motor.activo(), true);
  tiempo.avanzar(250);
  assert.equal(pasos.at(-1), 1);
  assert.equal(fines, 1);
  assert.equal(motor.activo(), false);
});

test("un toque nuevo termina el movimiento en curso de inmediato", () => {
  const tiempo = reloj();
  const motor = crearMotor(tiempo);
  const orden = [];
  motor.animar({ paso: () => orden.push("paso A"), fin: () => orden.push("fin A") });
  tiempo.avanzar(100);
  motor.animar({ paso: () => orden.push("paso B"), fin: () => orden.push("fin B") });
  assert.deepEqual(orden, ["paso A", "fin A"], "A ends before B starts");
  tiempo.avanzar(100);
  tiempo.avanzar(1000);
  assert.deepEqual(orden, ["paso A", "fin A", "paso B", "paso B", "fin B"],
    "the frame that A asked for draws nothing");
});

test("con movimiento reducido el paso es un fundido lineal de 150 ms", () => {
  const tiempo = reloj();
  const motor = crearMotor(tiempo);
  const pasos = [];
  let fin = false;
  motor.animar({ duracion: 500, reducido: true, paso: (t) => pasos.push(t), fin: () => { fin = true; } });
  tiempo.avanzar(75);
  assert.equal(pasos.at(-1), 0.5);
  tiempo.avanzar(75);
  assert.equal(fin, true);
});

test("sin cuadros el motor dibuja el final de una vez", () => {
  const pasos = [];
  let fin = false;
  crearMotor().animar({ paso: (t) => pasos.push(t), fin: () => { fin = true; } });
  assert.deepEqual(pasos, [1]);
  assert.equal(fin, true);
});

test("cada rueda del odometro gira cuando la de abajo pasa de 9 a 0", () => {
  assert.deepEqual(ruedasDelOdometro(129.5, 3), [
    { posicion: 1, visible: true },
    { posicion: 2.5, visible: true },
    { posicion: 9.5, visible: true },
  ]);
  assert.deepEqual(ruedasDelOdometro(1999.25, 4).map((rueda) => rueda.posicion),
    [1.25, 9.25, 9.25, 9.25]);
  assert.deepEqual(ruedasDelOdometro(42, 4), [
    { posicion: 0, visible: false },
    { posicion: 0, visible: false },
    { posicion: 4, visible: true },
    { posicion: 2, visible: true },
  ]);
  assert.equal(cifrasDe(123533955013701.5), 15);
});

test("el odometro pone un punto cada tres cifras", () => {
  const html = htmlDelOdometro(ruedasDelOdometro(1234, 4));
  assert.equal(html.match(/class="separador"/g).length, 1);
  assert.match(html, /^<span class="rueda"><span class="tira" style="transform:translateY\(-1\.200em\)">/);
  assert.equal(html.match(/class="rueda"/g).length, 4);
});
```

- [ ] **Step 2: Run the test and see it fail**

Run: `node --test test/movimiento.test.mjs`
Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Write the implementation**

Create `site/app/movimiento.js`:

```javascript
// The motion runner, and the wheels of the odometer.
//
// One loop runs at a time. A new motion ends the running one at once, and
// draws its last frame first (R4). The loop takes requestAnimationFrame and
// the clock as arguments, so a test drives the time by hand.

export const DURACION = 500;
export const DURACION_REDUCIDA = 150;
export const ALTO_DE_CIFRA = 1.2;

export function curvaBezier(x1, y1, x2, y2) {
  // The same curve as the CSS function cubic-bezier(). The x of the curve
  // grows with s, so a bisection finds the s of a given x.
  const coordenada = (uno, dos, s) => 3 * uno * s * (1 - s) ** 2 + 3 * dos * s * s * (1 - s) + s ** 3;
  return (x) => {
    if (x <= 0) {
      return 0;
    }
    if (x >= 1) {
      return 1;
    }
    let bajo = 0;
    let alto = 1;
    for (let vuelta = 0; vuelta < 30; vuelta += 1) {
      const medio = (bajo + alto) / 2;
      if (coordenada(x1, x2, medio) < x) {
        bajo = medio;
      } else {
        alto = medio;
      }
    }
    return coordenada(y1, y2, (bajo + alto) / 2);
  };
}

export const suavizar = curvaBezier(0.23, 1, 0.32, 1);

export function crearMotor({ cuadro, ahora } = {}) {
  let corriendo = null;

  function terminar() {
    if (!corriendo) {
      return;
    }
    const propio = corriendo;
    corriendo = null;
    propio.fin();
  }

  function animar({ duracion = DURACION, reducido = false, paso, fin }) {
    terminar();
    if (!cuadro) {
      // No frames: a test, or a page with no rendering. Draw the end.
      paso(1);
      fin();
      return;
    }
    // Reduced motion: a linear crossfade of 150ms, and never a moving ring.
    const largo = reducido ? DURACION_REDUCIDA : duracion;
    const curva = reducido ? (t) => t : suavizar;
    const inicio = ahora();
    const propio = { fin };
    corriendo = propio;
    const tic = (tiempo) => {
      if (corriendo !== propio) {
        return;
      }
      const t = Math.min(1, Math.max(0, (tiempo - inicio) / largo));
      paso(curva(t));
      if (t < 1) {
        cuadro(tic);
        return;
      }
      corriendo = null;
      fin();
    };
    cuadro(tic);
  }

  return { animar, terminar, activo: () => corriendo !== null };
}

export function ruedasDelOdometro(valor, cantidad) {
  // R5: the total rolls like an odometer. A wheel turns only while the wheel
  // below it goes from 9 to 0. The result starts at the largest wheel.
  const positivo = Math.max(0, valor);
  const entero = Math.floor(positivo);
  const posiciones = [];
  for (let potencia = 0; potencia < cantidad; potencia += 1) {
    const digito = Math.floor(entero / 10 ** potencia) % 10;
    const debajo = posiciones[potencia - 1];
    posiciones[potencia] = potencia === 0
      ? digito + (positivo - entero)
      : digito + (debajo > 9 ? debajo - 9 : 0);
  }
  return posiciones
    .map((posicion, potencia) => ({ posicion, visible: potencia === 0 || entero >= 10 ** potencia }))
    .reverse();
}

export function cifrasDe(valor) {
  return String(Math.round(Math.max(0, valor))).length;
}

const TIRA = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((digito) => `<span>${digito}</span>`).join("");

export function htmlDelOdometro(ruedas) {
  // Digits and dots only, never a name from the data.
  return ruedas.map(({ posicion, visible }, orden) => {
    const potencia = ruedas.length - 1 - orden;
    const desplazamiento = (-posicion * ALTO_DE_CIFRA).toFixed(3);
    const rueda = `<span class="rueda"${visible ? "" : " hidden"}>`
      + `<span class="tira" style="transform:translateY(${desplazamiento}em)">${TIRA}</span></span>`;
    const separador = visible && potencia > 0 && potencia % 3 === 0
      ? '<span class="separador">.</span>'
      : "";
    return rueda + separador;
  }).join("");
}
```

- [ ] **Step 4: Run the tests and see them pass**

Run: `node --test test/movimiento.test.mjs`
Expected: PASS, 8 tests.

Run: `node --test`
Expected: PASS, 147 tests, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add site/app/movimiento.js test/movimiento.test.mjs
git commit -F - <<'EOF'
Add the motion runner and the odometer

One loop runs at a time, and a new motion ends the running one at once.
The easing is the cubic Bezier of the spec. The odometer turns a wheel
while the wheel below it passes from 9 to 0.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```


---

### Task 7: The model of the history

R12 makes every step an entry in the history of the browser. The root is `#/<year>`. A nodo is `#/<year>/<clave>`. A group "otros" keeps the hash of its nodo, and its claves go to `history.state` (W8). A step pushes. A load that changes the place (a skip of a nodo with one child, an absent clave, a group that the data no longer has) replaces. A switch of the look writes nothing (W9), so it is not in this model.

**Files:**
- Modify: `site/app/ruta.js`
- Test: `test/ruta.test.mjs`

**Interfaces:**
- Consumes: `leerRuta`, `escribirRuta` of `ruta.js`.
- Produces:
  - A `ruta` is `{ anio, clave, grupos: string[][], desde: { anio, nombre, monto } | null }`, or `{ fuentes: true }`. `desde` is the exercise of origin of a change of year (D3).
  - `RUTA_DE_FUENTES = "#/fuentes"`.
  - `entradaDe(ruta) -> { hash, estado }`.
  - `rutaDeEntrada(hash, estado) -> ruta`. A state that names another place gives no group and no `desde`.
  - `escrituraDe(modo, actual, final) -> "push" | "replace" | null`. `modo` is `"paso"` or `"carga"`. `actual` and `final` are `{ hash, estado }`.
  - `contiene(arriba, clave) -> boolean`: the clave is the camino `arriba` or below it. The root `""` holds every clave.
  - `direccionEntre(antes, despues) -> "inicio" | "abajo" | "arriba" | "anio" | "igual" | "salto"`.


- [ ] **Step 1: Write the failing test**

In `test/ruta.test.mjs`, replace this text:

```javascript
  ancestroQueExiste, ejercicioDeEntrada, ejerciciosDisponibles, escribirRuta,
  leerRuta,
```

with:

```javascript
  ancestroQueExiste, direccionEntre, ejercicioDeEntrada, ejerciciosDisponibles, entradaDe,
  escribirRuta, escrituraDe,
  leerRuta, rutaDeEntrada,
```

Append to the end of `test/ruta.test.mjs`:

```javascript
const ruta = (anio, clave, grupos = [], desde = null) => ({ anio, clave, grupos, desde });

test("la raiz y un nodo tienen su hash, y el estado lleva la ruta", () => {
  assert.deepEqual(entradaDe(ruta(2025, "")), {
    hash: "#/2025",
    estado: { anio: 2025, clave: "", grupos: [], desde: null },
  });
  assert.equal(entradaDe(ruta(2025, "88-1")).hash, "#/2025/88-1");
  assert.deepEqual(entradaDe({ fuentes: true }), { hash: "#/fuentes", estado: { fuentes: true } });
});

test("un grupo otros guarda sus claves en el estado y no en la url", () => {
  // W8: a shared link opens the nodo of the group.
  const entrada = entradaDe(ruta(2025, "88", [["88-5", "88-6"]]));
  assert.equal(entrada.hash, "#/2025/88");
  assert.deepEqual(entrada.estado.grupos, [["88-5", "88-6"]]);
});

test("una entrada del historial vuelve a dar su ruta", () => {
  const original = ruta(2026, "88-9", [["88-9-1", "88-9-2"]], { anio: 2025, nombre: "Becas", monto: 4 });
  const { hash, estado } = entradaDe(original);
  assert.deepEqual(rutaDeEntrada(hash, estado), original);
  assert.deepEqual(rutaDeEntrada("#/2025/88", estado), ruta(2025, "88"),
    "a state of another place carries no group to this one");
  assert.deepEqual(rutaDeEntrada("#/2025/88", null), ruta(2025, "88"));
  assert.deepEqual(rutaDeEntrada("#/fuentes", null), { fuentes: true });
});

test("un paso agrega una entrada y un paso al mismo lugar no agrega nada", () => {
  const raiz = entradaDe(ruta(2025, ""));
  assert.equal(escrituraDe("paso", raiz, entradaDe(ruta(2025, "88"))), "push");
  assert.equal(escrituraDe("paso", raiz, entradaDe(ruta(2025, ""))), null,
    "the name of the site on the root");
  assert.equal(escrituraDe("paso", entradaDe(ruta(2025, "88")),
    entradaDe(ruta(2025, "88", [["88-5"]]))), "push", "a group is a step");
});

test("una carga que cambia el lugar reemplaza la entrada", () => {
  // R12: the link names a nodo with one child, and the navigator lands on
  // its child. Back must not return to the nodo that jumps forward.
  const salto = entradaDe(ruta(2025, "70-1"));
  assert.equal(escrituraDe("carga", { hash: "#/2025/70", estado: null }, salto), "replace");
  // The first load of a good link still writes the state.
  assert.equal(escrituraDe("carga", { hash: "#/2025/70-1", estado: null }, salto), "replace");
  assert.equal(escrituraDe("carga", salto, salto), null, "Back to an entry that holds");
  // A group that the data no longer has: draw the nodo, replace the entry.
  const conGrupo = entradaDe(ruta(2025, "88", [["88-7"]]));
  assert.equal(escrituraDe("carga", conGrupo, entradaDe(ruta(2025, "88"))), "replace");
});

test("la direccion entre dos rutas elige el movimiento", () => {
  assert.equal(direccionEntre(null, ruta(2025, "")), "inicio");
  assert.equal(direccionEntre(ruta(2025, ""), ruta(2025, "88")), "abajo");
  assert.equal(direccionEntre(ruta(2025, "88"), ruta(2025, "88-1-0")), "abajo");
  assert.equal(direccionEntre(ruta(2025, "88"), ruta(2025, "88", [["88-5"]])), "abajo");
  assert.equal(direccionEntre(ruta(2025, "88-1"), ruta(2025, "88")), "arriba");
  assert.equal(direccionEntre(ruta(2025, "", [["20"]]), ruta(2025, "")), "arriba");
  assert.equal(direccionEntre(ruta(2025, "88"), ruta(2026, "88")), "anio");
  assert.equal(direccionEntre(ruta(2025, "88"), ruta(2025, "88")), "igual");
  assert.equal(direccionEntre(ruta(2025, "88"), ruta(2025, "90")), "salto");
  assert.equal(direccionEntre(ruta(2025, "88"), { fuentes: true }), "salto");
  assert.equal(direccionEntre(ruta(2025, "88-10"), ruta(2025, "88-1")), "salto",
    "a clave is a camino, not a prefix of text");
});
```

- [ ] **Step 2: Run the test and see it fail**

Run: `node --test test/ruta.test.mjs`
Expected: FAIL with `SyntaxError: The requested module '../site/app/ruta.js' does not provide an export named 'direccionEntre'`.

- [ ] **Step 3: Write the implementation**

Append to the end of `site/app/ruta.js`:

```javascript
// ---- The history of the browser (R12) ----------------------------------
//
// A ruta is { anio, clave, grupos, desde }, or { fuentes: true }.
// grupos holds the claves of every open group "otros" over the nodo. W8: a
// group is not in the URL, so it lives in history.state. desde is the
// exercise of origin when a change of year lands on a clave that is absent:
// { anio, nombre, monto }, or null.

export const RUTA_DE_FUENTES = "#/fuentes";

export function entradaDe(ruta) {
  if (ruta.fuentes) {
    return { hash: RUTA_DE_FUENTES, estado: { fuentes: true } };
  }
  return {
    hash: escribirRuta(ruta.anio, ruta.clave),
    estado: {
      anio: ruta.anio, clave: ruta.clave, grupos: ruta.grupos ?? [], desde: ruta.desde ?? null,
    },
  };
}

export function rutaDeEntrada(hash, estado) {
  if (hash === RUTA_DE_FUENTES) {
    return { fuentes: true };
  }
  const { ejercicio, clave } = leerRuta(hash);
  // A state that names another place is not this entry: a shared link, or a
  // hash that the visitor typed. Its groups do not belong here.
  const propio = Boolean(estado) && estado.anio === ejercicio && estado.clave === clave;
  return {
    anio: ejercicio,
    clave,
    grupos: propio && Array.isArray(estado.grupos) ? estado.grupos : [],
    desde: propio ? estado.desde ?? null : null,
  };
}

export function escrituraDe(modo, actual, final) {
  // modo "paso": the visitor took a step, so the final place gets a new
  // entry. W6: "Volver" is a step too.
  // modo "carga": the page read an entry that exists already (the first
  // load, Back, Forward, a link). A skip of a nodo with one child, a clave
  // that is absent, or a group that the data no longer has changes the
  // place. The entry then gets the place that is on screen, with no new
  // entry: Back must never return to a place that jumps forward again.
  const igual = actual.hash === final.hash
    && JSON.stringify(actual.estado ?? null) === JSON.stringify(final.estado);
  if (igual) {
    return null;
  }
  return modo === "paso" ? "push" : "replace";
}

export function contiene(arriba, clave) {
  // The root holds every clave. Past the root, a clave is a camino of codes,
  // so "88-10" is not inside "88-1".
  return arriba === "" || clave === arriba || clave.startsWith(`${arriba}-`);
}

export function direccionEntre(antes, despues) {
  // The direction picks the motion: the rings go down or up, the screen
  // slides for a year, and a jump with no relation fades.
  if (!antes) {
    return "inicio";
  }
  if (antes.fuentes || despues.fuentes) {
    return antes.fuentes && despues.fuentes ? "igual" : "salto";
  }
  if (antes.anio !== despues.anio) {
    return "anio";
  }
  if (antes.clave === despues.clave) {
    const [uno, otro] = [antes.grupos.length, despues.grupos.length];
    if (uno === otro) {
      return JSON.stringify(antes.grupos) === JSON.stringify(despues.grupos) ? "igual" : "salto";
    }
    return otro > uno ? "abajo" : "arriba";
  }
  if (contiene(antes.clave, despues.clave)) {
    return "abajo";
  }
  if (contiene(despues.clave, antes.clave)) {
    return "arriba";
  }
  return "salto";
}
```

- [ ] **Step 4: Run the tests and see them pass**

Run: `node --test test/ruta.test.mjs`
Expected: PASS, 13 tests.

Run: `node --test`
Expected: PASS, 153 tests, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add site/app/ruta.js test/ruta.test.mjs
git commit -F - <<'EOF'
Add the model of the history of the browser

A step pushes an entry, and a load that changes the place replaces it.
A group "otros" keeps the hash of its nodo and puts its claves in the
state. The direction between two entries picks the motion.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```


---

### Task 8: The views of the frame

The rings, the breadcrumb and "Volver" all need the path from the root to the screen on view. The pila holds one level per screen. A group "otros" is a level of its own. `pilaDe` walks down through the parts as a visitor taps them, so a clave inside a group passes through that group. `vistaDeNavegador` joins the view of plan 2 with the breadcrumb, the years, the line of R18, the sentence and the scene of the rings.

This task adds pure functions only. The screens of plan 2 keep working until Task 10.

**Files:**
- Modify: `site/app/pantalla.js`
- Test: `test/pantalla.test.mjs`

**Interfaces:**
- Consumes: `escenaDe` (Task 1), `migaCorta` (Task 2), `fraseDe` (Task 3), `contiene` (Task 7), and `vistaDeRaiz`, `vistaDeNodo`, `porcionesDe`, `saltarHijoUnico` of plan 2.
- Produces:
  - A `Nivel` of the pila: `{ clave, grupo: string[] | null, nombre, hoja, porciones, elegida: number | null }`. The root is named "Inicio" and a group is named "Otros". The last level shows the nodo itself as its one part (D2).
  - `pilaDe(indice, clave, grupos = []) -> Nivel[]`. A group that the data no longer has ends the walk.
  - `rutaDePila(pila) -> { clave, grupos }`.
  - `aniosVecinos(disponibles, ejercicio) -> { anterior, siguiente }`, each a year or `null`.
  - `lineaDeDetalle(vista) -> string`, the line of R18.
  - `vistaDeNavegador(estado, pila) -> vista`. It holds every field of `vistaDeRaiz` or `vistaDeNodo`, and adds `porciones`, `hoja`, `nivel`, `pila`, `miga`, `anterior`, `siguiente`, `subtitulo`, `detalle`, `rotulo`, `mensajeVacio`, `frase` and `escena`.


- [ ] **Step 1: Write the failing test**

In `test/pantalla.test.mjs`, replace this text:

```javascript
import {
  dibujarAusente,
```

with:

```javascript
import {
  aniosVecinos, pilaDe, rutaDePila, vistaDeNavegador,
  dibujarAusente,
```

Append to the end of `test/pantalla.test.mjs`:

```javascript
// ---- The views of the frame ----------------------------------------------

// A root with one large part and a group "otros". "Chica" is 3 of 95, about
// 3,2%, and "Menor" is 2 of 95, about 2,1%. "Chica" divides in two.
const CON_OTROS = {
  ...ESTADO,
  indice: {
    "1": { n: "Grande", d: 90, p: 90, v: 90, g: 90, k: [] },
    "2": { n: "Chica", d: 3, p: 3, v: 3, g: 3, k: ["1", "2"] },
    "2-1": { n: "Chica uno", d: 2, p: 2, v: 2, g: 2, k: [] },
    "2-2": { n: "Chica dos", d: 1, p: 1, v: 1, g: 1, k: [] },
    "3": { n: "Menor", d: 2, p: 2, v: 2, g: 2, k: [] },
  },
};

test("la pila baja por las partes y salta el nodo de un solo hijo", () => {
  const pila = pilaDe(ESTADO.indice, "88-1");
  assert.deepEqual(pila.map((nivel) => nivel.nombre), ["Inicio", "ANSES"]);
  assert.equal(pila[0].elegida, 0, "the part of Capital Humano leads to ANSES");
  assert.equal(pila[1].hoja, true);
  assert.deepEqual(pila[1].porciones, [
    { nombre: "ANSES", monto: 60, parte: 1, esOtros: false, destino: ["88-1"] },
  ], "the last level shows the nodo itself as one full ring");
});

test("una clave dentro de otros pasa por el grupo", () => {
  const pila = pilaDe(CON_OTROS.indice, "2");
  assert.deepEqual(pila.map((nivel) => nivel.nombre), ["Inicio", "Otros", "Chica"]);
  assert.deepEqual(pila[1].grupo, ["2", "3"]);
  assert.deepEqual([pila[0].elegida, pila[1].elegida, pila[2].elegida], [1, 0, null]);
  assert.deepEqual(rutaDePila(pila), { clave: "2", grupos: [] });
  assert.deepEqual(rutaDePila(pila.slice(0, 2)), { clave: "", grupos: [["2", "3"]] },
    "Volver from Chica goes to the group");
});

test("un grupo que los datos ya no tienen deja la pila en el nodo", () => {
  assert.equal(pilaDe(CON_OTROS.indice, "", [["2", "3"]]).length, 2);
  const perdido = pilaDe(CON_OTROS.indice, "", [["9"]]);
  assert.equal(perdido.length, 1);
  assert.deepEqual(rutaDePila(perdido), { clave: "", grupos: [] },
    "the route of the place on screen has no group, so the entry is replaced");
});

test("la vista de la raiz lleva la medida, la linea y la frase", () => {
  const vista = vistaDeNavegador(ESTADO, pilaDe(ESTADO.indice, ""));
  assert.deepEqual(vista.miga, []);
  assert.deepEqual([vista.anterior, vista.siguiente], [2024, null],
    "R11: 2025 is the last year of this manifest");
  assert.equal(vista.subtitulo, "Crédito devengado del ejercicio 2025, por jurisdicción");
  // Execution: 100 of 104 is 96,15%. Deviation: 100 over 82 is +21,95%.
  assert.equal(vista.detalle, "96,2% de lo autorizado · +22% sobre lo aprobado");
  assert.equal(vista.rotulo, "Total devengado 2025");
  assert.equal(`${vista.frase.antes}${vista.frase.cifra}${vista.frase.despues}`,
    "De cada $100 que gastó el Estado nacional en 2025, $60 fueron a Capital Humano.");
  assert.deepEqual(vista.escena.map((arco) => arco.abrir), [0, 1, 2]);
});

test("la vista de la ultima hoja compara el nodo con el total nacional", () => {
  const vista = vistaDeNavegador(ESTADO, pilaDe(ESTADO.indice, "88-1"));
  assert.equal(vista.hoja, true);
  assert.deepEqual(vista.miga, [{ nivel: 0, nombre: "Inicio" }]);
  // 60 of 100 is 60%. Execution 60 of 62 is 96,77%. Deviation 60 over 40.
  assert.equal(vista.detalle, "60,0% del gasto total · 96,8% de lo autorizado · +50% sobre lo aprobado");
  assert.equal(vista.frase.despues, " fueron a ANSES.");
  assert.equal(vista.frase.cifra, "$60");
  assert.equal(vista.subtitulo, "");
  assert.ok(vista.procedencia.codigos, "C16: the codes of the source at the last level");
});

test("la vista de un grupo otros solo dice su parte del total", () => {
  const vista = vistaDeNavegador(CON_OTROS, pilaDe(CON_OTROS.indice, "", [["2", "3"]]));
  assert.equal(vista.titulo, "Otros");
  // 5 of 95 is 5,26%.
  assert.equal(vista.detalle, "5,3% del gasto total");
  assert.equal(vista.subtitulo, "Parte del gasto del Estado nacional.");
  assert.equal(vista.rotulo, "Suma de estas partidas");
  assert.equal(vista.frase.antes, "De cada $100 que gastó el grupo otros del Estado nacional en 2025, ");
  assert.deepEqual(vista.miga, [{ nivel: 0, nombre: "Inicio" }]);
});

test("un nivel sin gasto dice que no gasto nada y dibuja un anillo vacio", () => {
  const cero = { ...ESTADO, indice: {
    "9": { n: "Sin gasto", d: 0, p: 0, v: 0, g: 0, k: [] },
    "8": { n: "Con gasto", d: 5, p: 5, v: 5, g: 5, k: [] },
  } };
  const vista = vistaDeNavegador(cero, pilaDe(cero.indice, "9"));
  assert.equal(vista.mensajeVacio, "Este nivel no gastó nada en 2025.");
  assert.equal(vista.escena.filter((arco) => arco.rol === "principal").length, 0);
});

test("los anios vecinos se detienen en las puntas", () => {
  assert.deepEqual(aniosVecinos([2024, 2025, 2026], 2024), { anterior: null, siguiente: 2025 });
  assert.deepEqual(aniosVecinos([2024, 2025, 2026], 2025), { anterior: 2024, siguiente: 2026 });
  assert.deepEqual(aniosVecinos([2024, 2025, 2026], 2026), { anterior: 2025, siguiente: null });
});
```

- [ ] **Step 2: Run the test and see it fail**

Run: `node --test test/pantalla.test.mjs`
Expected: FAIL with `SyntaxError: The requested module '../site/app/pantalla.js' does not provide an export named 'aniosVecinos'`.

- [ ] **Step 3: Write the implementation**

In `site/app/pantalla.js`, replace this text:

```javascript
import {
  hijosDe, migaDePan, nivelDe, NIVELES_INSTITUCIONALES, raices, saltarHijoUnico,
  totalDe,
} from "./arbol.js";
```

with:

```javascript
import { escenaDe } from "./anillos.js";
import {
  hijosDe, migaCorta, migaDePan, nivelDe, NIVELES_INSTITUCIONALES, raices,
  saltarHijoUnico, totalDe,
} from "./arbol.js";
```

In `site/app/pantalla.js`, replace this text:

```javascript
import { conSigno, fechaCorta, montoCorto, montoLargo, porcentaje }
  from "./formato.js";
```

with:

```javascript
import { fraseDe } from "./frase.js";
import { conSigno, fechaCorta, montoCorto, montoLargo, porcentaje }
  from "./formato.js";
```

In `site/app/pantalla.js`, replace this text:

```javascript
import { ancestroQueExiste } from "./ruta.js";
```

with:

```javascript
import { ancestroQueExiste, contiene } from "./ruta.js";
```

Append to the end of `site/app/pantalla.js`:

```javascript
// ---- The views of the frame ---------------------------------------------
//
// The pila holds one level per screen, from the root to the screen on view:
// { clave, grupo, nombre, hoja, porciones, elegida }. A group "otros" is a
// level of its own, on the clave of its nodo. The rings, the breadcrumb and
// "Volver" all read the pila.

const NOMBRE_DE_LA_RAIZ = "Inicio";

function mismoGrupo(uno, otro) {
  return uno.length === otro.length && uno.every((clave, orden) => clave === otro[orden]);
}

function nivelDePila(indice, clave, grupo) {
  if (grupo) {
    return {
      clave, grupo, nombre: TITULO_DE_UN_GRUPO, hoja: false, elegida: null,
      porciones: porcionesDe(indice, grupo, "d").porciones,
    };
  }
  if (clave === "") {
    return {
      clave, grupo: null, nombre: NOMBRE_DE_LA_RAIZ, hoja: false, elegida: null,
      porciones: porcionesDe(indice, raices(indice), "d").porciones,
    };
  }
  const nodo = indice[clave];
  // A nodo of level 9 lists object codes whose file may be absent. A child
  // that is not in the index is not a part.
  const hijos = hijosDe(indice, clave).filter((hijo) => indice[hijo]);
  if (hijos.length === 0) {
    // The last level: one full ring and one row, the nodo itself (UC-02).
    return {
      clave, grupo: null, nombre: nodo.n, hoja: true, elegida: null,
      porciones: nodo.d > 0
        ? [{ nombre: nodo.n, monto: nodo.d, parte: 1, esOtros: false, destino: [clave] }]
        : [],
    };
  }
  return {
    clave, grupo: null, nombre: nodo.n, hoja: false, elegida: null,
    porciones: porcionesDe(indice, hijos, "d").porciones,
  };
}

export function pilaDe(indice, clave, grupos = []) {
  // Walk down from the root through the parts, as a visitor taps them. A
  // clave inside a group "otros" passes through that group.
  const pila = [nivelDePila(indice, "", null)];
  for (;;) {
    const arriba = pila.at(-1);
    if (arriba.clave === clave && !arriba.grupo) {
      break;
    }
    const orden = arriba.porciones
      .findIndex((porcion) => porcion.destino.some((destino) => contiene(destino, clave)));
    const porcion = arriba.porciones[orden];
    const siguiente = porcion && !porcion.esOtros
      ? saltarHijoUnico(indice, porcion.destino[0])
      : arriba.clave;
    if (!porcion || !contiene(siguiente, clave)) {
      // No part leads there: a group with no spending, or a clave that the
      // walk cannot reach. Show the clave itself, with no lit arc above it.
      pila.push(nivelDePila(indice, clave, null));
      break;
    }
    arriba.elegida = orden;
    pila.push(nivelDePila(indice, siguiente, porcion.esOtros ? porcion.destino : null));
  }
  // The groups that the visitor opened over the nodo, in order. A group that
  // the data no longer has ends the walk, and rutaDePila then drops it.
  for (const grupo of grupos) {
    const arriba = pila.at(-1);
    const orden = arriba.porciones
      .findIndex((porcion) => porcion.esOtros && mismoGrupo(porcion.destino, grupo));
    if (orden === -1) {
      break;
    }
    arriba.elegida = orden;
    pila.push(nivelDePila(indice, arriba.clave, arriba.porciones[orden].destino));
  }
  return pila;
}

export function rutaDePila(pila) {
  // The inverse of pilaDe: the last level that is not a group gives the
  // clave, and the groups above it give grupos.
  let ultimo = pila.length - 1;
  while (pila[ultimo].grupo) {
    ultimo -= 1;
  }
  return { clave: pila[ultimo].clave, grupos: pila.slice(ultimo + 1).map((nivel) => nivel.grupo) };
}

export function aniosVecinos(disponibles, ejercicio) {
  // R11: the arrow at an end has no year, and the screen disables it.
  const orden = disponibles.indexOf(ejercicio);
  return {
    anterior: orden > 0 ? disponibles[orden - 1] : null,
    siguiente: orden !== -1 && orden < disponibles.length - 1 ? disponibles[orden + 1] : null,
  };
}

export function lineaDeDetalle(vista) {
  // R18: the part of the total, the execution and the deviation. A group
  // "otros" has only the part of the total.
  const partes = [];
  if (vista.parteDelTotal !== null) {
    partes.push(`${porcentaje(vista.parteDelTotal)} del gasto total`);
  }
  if (vista.ejecucion !== null) {
    partes.push(`${porcentaje(vista.ejecucion)} de lo autorizado`);
  }
  if (vista.desviacion) {
    const palabra = PALABRA_DE_LA_DESVIACION[vista.desviacion.tipo];
    partes.push(`${conSigno(vista.desviacion.valor)} ${palabra}`);
  }
  return partes.join(" · ");
}

export function vistaDeNavegador(estado, pila) {
  const { indice, ejercicio, disponibles } = estado;
  const arriba = pila.at(-1);
  const enLaRaiz = arriba.clave === "";
  const base = enLaRaiz
    ? vistaDeRaiz(estado, arriba.grupo)
    : vistaDeNodo(estado, arriba.clave, arriba.grupo);
  const deQuien = enLaRaiz ? "del Estado nacional" : `de ${indice[arriba.clave].n}`;
  let nodo = enLaRaiz ? null : indice[arriba.clave].n;
  if (arriba.grupo) {
    nodo = `el grupo otros ${deQuien}`;
  }
  let subtitulo = "";
  if (arriba.grupo) {
    subtitulo = `Parte ${base.parteDe}.`;
  } else if (enLaRaiz) {
    // R8: the measure is named here and in the foot of the tape only.
    subtitulo = `Crédito devengado del ejercicio ${ejercicio}, por jurisdicción`;
  }
  let mensajeVacio = null;
  if (arriba.porciones.length === 0) {
    mensajeVacio = arriba.grupo
      ? `Estas partidas no gastaron nada en ${ejercicio}.`
      : `Este nivel no gastó nada en ${ejercicio}.`;
  }
  return {
    ...base,
    porciones: arriba.porciones,
    hoja: arriba.hoja,
    nivel: pila.length - 1,
    pila,
    miga: migaCorta(pila.map((nivel) => nivel.nombre)),
    ...aniosVecinos(disponibles, ejercicio),
    subtitulo,
    detalle: lineaDeDetalle(base),
    rotulo: enLaRaiz && !arriba.grupo ? `Total devengado ${ejercicio}` : "Suma de estas partidas",
    mensajeVacio,
    frase: fraseDe({
      anio: ejercicio,
      nodo,
      // The last level shows the nodo itself as its one part. The sentence
      // compares that nodo with the national total instead.
      porciones: arriba.hoja ? [] : arriba.porciones,
      total: base.total,
      totalNacional: totalDe(indice, raices(indice), "d"),
    }),
    escena: escenaDe(pila),
  };
}
```

- [ ] **Step 4: Run the tests and see them pass**

Run: `node --test test/pantalla.test.mjs`
Expected: PASS, 49 tests.

Run: `node --test`
Expected: PASS, 161 tests, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add site/app/pantalla.js test/pantalla.test.mjs
git commit -F - <<'EOF'
Add the pila and the view of the frame

The pila holds one level per screen from the root, and a group "otros"
is a level of its own. The view of the frame adds the short breadcrumb,
the years, the line of the deviation, the sentence and the rings.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```


---

### Task 9: The painters of the five places

`index.html` will hold the frame once (Task 10). A painter writes the parts of the frame for one place, and it finds every part by its id. It holds no decision. This task writes the painters of P1 and P2, P2b (W12), P4 (W13) and the failure screen, and tests them with the fake document, which creates an element for every id it gets.

The frame ids that the painters write:

| Region | Ids |
|---|---|
| Top bar | `anio`, `anio-anterior`, `anio-siguiente`, `miga` |
| Chart pane | `volver`, `titulo`, `frase`, `subtitulo`, `detalle`, `nota`, `acciones`, `caja`, `anillos`, `disco-numero`, `disco-unidad` |
| Tape pane | `renglones`, `pie`, `cuenta`, `rotulo`, `total`, `total-texto`, `fuente`, `codigos`, `descargar` |

The controls carry one data attribute each, and Task 10 answers them: `data-abrir="<order>"` opens a part, `data-subir="<level>"` goes to a level of the pila, `data-anio="<year>"` changes the year, `data-clave="<clave>"` goes to a clave of the year on screen, `data-expandir` opens the crumb "…", and `data-fuentes` opens P4.

**Files:**
- Modify: `site/app/pantalla.js`
- Test: `test/pantalla.test.mjs`

**Interfaces:**
- Consumes: `colorDe`, `svgDeEscena` (Task 1); `partesDelMonto` (Task 4); `RUTA_DE_FUENTES` (Task 7); `vistaDeNavegador` (Task 8); `vistaDeFuentes`, `estadoDeLaFila`, `vistaDeError` of plan 2.
- Produces:
  - `pintarBarra(documento, { ejercicio, anterior, siguiente, miga })`. `ejercicio` is `null` on P4 and on the failure screen (D6).
  - `pintarNavegador(documento, vista)`. `vista` comes from `vistaDeNavegador`, plus an optional `nota` string.
  - `pintarAusente(documento, vista)`. `vista` is `{ ejercicio, anterior, siguiente, miga, nombre, origen: { ejercicio, monto }, ancestro, lineas: string[], procedencia }`. Task 10 builds it with `vistaDeAusente`.
  - `pintarFuentes(documento, vista)`, with `vista` from `vistaDeFuentes`.
  - `pintarError(documento, vista)`, with `vista` from `vistaDeError`.
  - `expandirMiga(control)`: shows the hidden crumbs in place. It uses `closest` and `querySelectorAll`, so the walk of the plan checks it in the browser.


- [ ] **Step 1: Write the failing test**

In `test/pantalla.test.mjs`, replace this text:

```javascript
  aniosVecinos, pilaDe, rutaDePila, vistaDeNavegador,
```

with:

```javascript
  aniosVecinos, pilaDe, pintarAusente, pintarBarra, pintarError, pintarFuentes,
  pintarNavegador, rutaDePila, vistaDeError, vistaDeNavegador,
```

In `test/pantalla.test.mjs`, replace this text:

```javascript
import { SOBRE_LO_APROBADO } from "../site/app/desviacion.js";
```

with:

```javascript
import { migaCorta } from "../site/app/arbol.js";
import { SOBRE_LO_APROBADO } from "../site/app/desviacion.js";
```

Append to the end of `test/pantalla.test.mjs`:

```javascript
// ---- The painters of the frame --------------------------------------------

const enMarco = (documento, id) => documento.getElementById(id);

test("el navegador escribe el titulo, la linea y el total en el marco", () => {
  const documento = falsoDocumento();
  pintarNavegador(documento, vistaDeNavegador(ESTADO, pilaDe(ESTADO.indice, "")));
  assert.equal(enMarco(documento, "titulo").textContent, "En qué la gastó el Estado nacional");
  assert.equal(enMarco(documento, "volver").hidden, true, "the root has no Volver");
  assert.equal(enMarco(documento, "detalle").textContent,
    "96,2% de lo autorizado · +22% sobre lo aprobado");
  assert.equal(enMarco(documento, "total-texto").textContent, "105.250.000 pesos",
    "the verified total, never the sum");
  // R7: 105.250.000 pesos is "105,3 millones", on two lines.
  assert.equal(enMarco(documento, "disco-numero").textContent, "105,3");
  assert.equal(enMarco(documento, "disco-unidad").textContent, "millones");
  assert.equal(enMarco(documento, "frase").hidden, false);
  assert.match(enMarco(documento, "anillos").innerHTML, /data-abrir="2"/);
  assert.match(textoDe(enMarco(documento, "fuente")), /credito-anual-2025\.zip/,
    "UC-06: the foot names its source");
});

test("cada fila de la cinta es un boton que abre su parte", () => {
  const documento = falsoDocumento();
  pintarNavegador(documento, vistaDeNavegador(ESTADO, pilaDe(ESTADO.indice, "")));
  const filas = enMarco(documento, "renglones").hijos[0].hijos;
  assert.equal(filas.length, 3);
  const segunda = filas[1];
  assert.equal(segunda.etiqueta, "li");
  assert.equal(segunda.atributos.style, "animation-delay:30ms", "R5: 30ms apart");
  const control = segunda.hijos[0];
  assert.equal(control.etiqueta, "button", "a native control answers Enter and Space");
  assert.equal(control.atributos["data-abrir"], "1");
  assert.equal(control.atributos["aria-label"], "Deuda, 30,0%, 30,0 millones");
});

test("la fila de otros dice cuantas partes junta y lleva el color neutro", () => {
  const documento = falsoDocumento();
  pintarNavegador(documento, vistaDeNavegador(CON_OTROS, pilaDe(CON_OTROS.indice, "")));
  const otros = enMarco(documento, "renglones").hijos[0].hijos[1].hijos[0];
  assert.equal(otros.hijos[1].textContent, "Otros (2)");
  assert.equal(otros.hijos[0].atributos.style, "background:var(--otros)");
});

test("la ultima hoja muestra una fila que no abre y los codigos al pie", () => {
  const documento = falsoDocumento();
  pintarNavegador(documento, vistaDeNavegador(ESTADO, pilaDe(ESTADO.indice, "88-1")));
  const fila = enMarco(documento, "renglones").hijos[0].hijos[0].hijos[0];
  assert.equal(fila.etiqueta, "div", "a row that opens nothing is not a control");
  assert.equal(fila.atributos["data-abrir"], undefined);
  assert.equal(enMarco(documento, "codigos").textContent, "jurisdiccion_id=88 · subjurisdiccion_id=1");
  assert.equal(enMarco(documento, "volver").hidden, false);
  assert.equal(enMarco(documento, "volver").atributos["data-subir"], "0");
});

test("un nivel sin gasto lo dice en la cinta", () => {
  const cero = { ...ESTADO, indice: {
    "9": { n: "Sin gasto", d: 0, p: 0, v: 0, g: 0, k: [] },
    "8": { n: "Con gasto", d: 5, p: 5, v: 5, g: 5, k: [] },
  } };
  const documento = falsoDocumento();
  pintarNavegador(documento, vistaDeNavegador(cero, pilaDe(cero.indice, "9")));
  assert.equal(textoDe(enMarco(documento, "renglones")).trim(), "Este nivel no gastó nada en 2025.");
  assert.match(enMarco(documento, "anillos").innerHTML, /^<path class="contorno"/);
});

test("la miga pone los niveles del medio detras de los puntos", () => {
  const documento = falsoDocumento();
  pintarBarra(documento, {
    ejercicio: 2025, anterior: 2024, siguiente: null,
    miga: migaCorta(["", "Uno", "Dos", "Tres", "Cuatro", "Cinco"]),
  });
  const items = enMarco(documento, "miga").hijos[0].hijos;
  assert.deepEqual(items.map((item) => textoDe(item).trim()),
    ["Inicio", "Uno", "…", "Dos", "Tres", "Cuatro"]);
  assert.deepEqual(items.map((item) => Boolean(item.hidden)),
    [false, false, false, true, true, false]);
  assert.equal(items[2].hijos[0].atributos["aria-label"], "Mostrar 2 niveles intermedios");
  assert.deepEqual(items.map((item) => item.hijos[0].atributos["data-subir"]),
    ["0", "1", undefined, "2", "3", "4"]);
});

test("las flechas del anio se apagan en las puntas", () => {
  const documento = falsoDocumento();
  pintarBarra(documento, { ejercicio: 2025, anterior: 2024, siguiente: null, miga: [] });
  assert.equal(enMarco(documento, "anio").textContent, "2025");
  assert.equal(enMarco(documento, "anio-anterior").disabled, false);
  assert.equal(enMarco(documento, "anio-anterior").atributos["data-anio"], "2024");
  assert.equal(enMarco(documento, "anio-siguiente").disabled, true);
  assert.equal(enMarco(documento, "miga").hidden, true, "the root has no breadcrumb");
});

test("la pantalla del ausente no tiene Volver y ofrece dos salidas", () => {
  const documento = falsoDocumento();
  pintarAusente(documento, {
    ejercicio: 2025, anterior: 2024, siguiente: null,
    miga: [{ nivel: 0, nombre: "Inicio" }, { nivel: 1, nombre: "Capital Humano" }],
    nombre: "Becas",
    origen: { ejercicio: 2024, monto: 12 },
    ancestro: "88",
    lineas: ["Este nivel no existe en 2025.", "En 2024 gastó 12,0 millones."],
    procedencia: { archivo: ESTADO.entrada.archivo, fecha: ESTADO.entrada.publicado, codigos: null },
  });
  assert.equal(enMarco(documento, "volver").hidden, true, "W12");
  assert.equal(enMarco(documento, "titulo").textContent, "Becas");
  const acciones = enMarco(documento, "acciones");
  assert.deepEqual(controles(acciones, "data-clave"),
    [{ texto: "Subir al nivel que sí existe", valor: "88" }]);
  assert.deepEqual(controles(acciones, "data-anio"), [{ texto: "Volver a 2024", valor: "2024" }]);
  assert.match(textoDe(enMarco(documento, "nota")), /En 2024 gastó 12,0 millones\./);
  assert.match(enMarco(documento, "anillos").innerHTML, /^<path class="contorno"/);
  assert.equal(enMarco(documento, "cuenta").hidden, true, "no rows, so no sum");
  assert.equal(enMarco(documento, "pie").hidden, false, "the foot of the year on screen");
});

test("las fuentes ponen el metodo en el grafico y la tabla en la cinta", () => {
  const documento = falsoDocumento();
  pintarFuentes(documento, vistaDeFuentes(MANIFIESTO));
  assert.match(textoDe(enMarco(documento, "nota")), /CC BY 4\.0/);
  assert.match(textoDe(enMarco(documento, "nota")), /Ministerio de Economía/);
  assert.equal(enMarco(documento, "caja").hidden, true, "W13: no chart on P4");
  const tabla = enMarco(documento, "renglones").hijos[0];
  assert.equal(tabla.etiqueta, "table");
  assert.equal(tabla.hijos.length, 2);
  assert.match(textoDe(tabla), /credito-anual-2025\.zip/);
  assert.deepEqual(controles(enMarco(documento, "acciones"), "data-clave"),
    [{ texto: "Volver al inicio", valor: "" }]);
  assert.ok(controles(enMarco(documento, "acciones"), "href")
    .some((control) => control.texto === "El código de este proyecto"));
});

test("la pantalla de un fallo tiene sus salidas en el marco", () => {
  const documento = falsoDocumento();
  pintarError(documento, vistaDeError(new Error("Unexpected end of JSON input")));
  assert.match(enMarco(documento, "titulo").textContent, /No pudimos mostrar esta pantalla/);
  assert.match(textoDe(enMarco(documento, "nota")), /Unexpected end of JSON input/,
    "the detail helps a report");
  const acciones = enMarco(documento, "acciones");
  assert.deepEqual(controles(acciones, "data-clave"), [{ texto: "Volver al inicio", valor: "" }],
    "a button, and never a link to the route already on screen");
  assert.deepEqual(controles(acciones, "href"),
    [{ texto: "De dónde salen estos números", valor: "#/fuentes" }]);
  assert.equal(enMarco(documento, "fuente").textContent, "Fuente: Presupuesto Abierto");
  assert.equal(enMarco(documento, "descargar").hidden, true);
});
```

- [ ] **Step 2: Run the test and see it fail**

Run: `node --test test/pantalla.test.mjs`
Expected: FAIL with `SyntaxError: The requested module '../site/app/pantalla.js' does not provide an export named 'pintarAusente'`.

- [ ] **Step 3: Write the implementation**

In `site/app/pantalla.js`, replace this text:

```javascript
import { escenaDe } from "./anillos.js";
```

with:

```javascript
import { colorDe, escenaDe, svgDeEscena } from "./anillos.js";
```

In `site/app/pantalla.js`, replace this text:

```javascript
import { conSigno, fechaCorta, montoCorto, montoLargo, porcentaje }
  from "./formato.js";
```

with:

```javascript
import {
  conSigno, fechaCorta, montoCorto, montoLargo, partesDelMonto, porcentaje,
} from "./formato.js";
```

In `site/app/pantalla.js`, replace this text:

```javascript
import { ancestroQueExiste, contiene } from "./ruta.js";
```

with:

```javascript
import { ancestroQueExiste, contiene, RUTA_DE_FUENTES } from "./ruta.js";
```

Append to the end of `site/app/pantalla.js`:

```javascript
// ---- The painters of the frame --------------------------------------------
//
// index.html holds the frame once: the top bar, the chart pane and the tape
// pane. A painter writes the parts of the frame for one place, and it holds
// no decision. Every part is found by its id.

const FUENTE_SIN_DATOS = "Fuente: Presupuesto Abierto";

const METODO = [
  "Los datos son de Presupuesto Abierto, del Ministerio de Economía de la "
  + "Nación, bajo licencia CC BY 4.0. Este proyecto lee los mismos archivos "
  + "que ofrece la página oficial de datos abiertos. Las URLs son idénticas.",
  "En cada corrida, el build suma el total de cada ejercicio y lo compara "
  + "con el informe oficial Cuenta Ahorro Inversión Financiamiento. El "
  + "ejercicio cuyo total no coincide no se publica, y esta tabla lo dice.",
];

function parte(documento, id) {
  return documento.getElementById(id);
}

function vaciar(elemento) {
  while (elemento.firstChild) {
    elemento.removeChild(elemento.firstChild);
  }
}

function escribir(documento, id, contenido) {
  const elemento = parte(documento, id);
  elemento.textContent = contenido;
  elemento.hidden = contenido === "";
  return elemento;
}

function boton(documento, contenido, clase) {
  const elemento = texto(documento, "button", contenido, clase);
  elemento.setAttribute("type", "button");
  return elemento;
}

function pasoDeMiga(documento, tramo, oculto) {
  // A crumb stays a control inside its <li>, as in the navigator before.
  const item = documento.createElement("li");
  item.hidden = oculto;
  const control = boton(documento, tramo.nombre, "tramo");
  control.setAttribute("data-subir", String(tramo.nivel));
  item.appendChild(control);
  return item;
}

export function pintarBarra(documento, barra) {
  // W2: one top bar on every place. A place with no exercise passes null.
  parte(documento, "anio").textContent = barra.ejercicio === null ? "" : String(barra.ejercicio);
  for (const [id, anio] of [["anio-anterior", barra.anterior], ["anio-siguiente", barra.siguiente]]) {
    const flecha = parte(documento, id);
    flecha.disabled = anio === null;
    flecha.setAttribute("data-anio", anio === null ? "" : String(anio));
  }
  const miga = parte(documento, "miga");
  vaciar(miga);
  miga.hidden = barra.miga.length === 0;
  if (miga.hidden) {
    return;
  }
  const lista = documento.createElement("ol");
  for (const tramo of barra.miga) {
    if (!tramo.ocultos) {
      lista.appendChild(pasoDeMiga(documento, tramo, false));
      continue;
    }
    // A4: "…" opens the hidden levels in place. They wait after it, hidden.
    const puntos = documento.createElement("li");
    puntos.setAttribute("class", "puntos");
    const abrir = boton(documento, "…", "tramo");
    abrir.setAttribute("data-expandir", "");
    abrir.setAttribute("aria-label", `Mostrar ${tramo.ocultos.length} niveles intermedios`);
    puntos.appendChild(abrir);
    lista.appendChild(puntos);
    for (const oculto of tramo.ocultos) {
      lista.appendChild(pasoDeMiga(documento, oculto, true));
    }
  }
  miga.appendChild(lista);
}

export function expandirMiga(control) {
  // The browser runs this, and the walk of the plan checks it: the fake
  // document of the tests has no querySelectorAll.
  const puntos = control.closest("li");
  const ocultos = [...puntos.parentElement.querySelectorAll("li[hidden]")];
  for (const item of ocultos) {
    item.hidden = false;
  }
  puntos.hidden = true;
  ocultos[0]?.querySelector("button")?.focus();
}

function pintarGrafico(documento, {
  volver = null, titulo, frase = null, subtitulo = "", detalle = "", notas = [],
  acciones = [], anillos = null, disco = null,
}) {
  const controlVolver = parte(documento, "volver");
  const teniaElFoco = documento.activeElement === controlVolver;
  controlVolver.hidden = volver === null;
  if (volver !== null) {
    controlVolver.setAttribute("data-subir", String(volver));
  }
  const encabezado = parte(documento, "titulo");
  encabezado.textContent = titulo;
  if (controlVolver.hidden && teniaElFoco) {
    // R21: a control that disappears must not take the focus with it.
    encabezado.focus();
  }

  const oracion = parte(documento, "frase");
  vaciar(oracion);
  oracion.hidden = frase === null;
  if (frase) {
    // The amount goes in bold, and every piece goes in as text.
    oracion.appendChild(texto(documento, "span", frase.antes));
    oracion.appendChild(texto(documento, "b", frase.cifra));
    oracion.appendChild(texto(documento, "span", frase.despues));
  }
  escribir(documento, "subtitulo", subtitulo);
  escribir(documento, "detalle", detalle);

  const nota = parte(documento, "nota");
  vaciar(nota);
  nota.hidden = notas.length === 0;
  for (const linea of notas) {
    nota.appendChild(texto(documento, "p", linea));
  }
  const lugar = parte(documento, "acciones");
  vaciar(lugar);
  lugar.hidden = acciones.length === 0;
  for (const accion of acciones) {
    lugar.appendChild(accion);
  }

  parte(documento, "caja").hidden = anillos === null;
  if (anillos !== null) {
    parte(documento, "anillos").innerHTML = svgDeEscena(anillos);
    const { numero, unidad } = disco ?? { numero: "", unidad: "" };
    parte(documento, "disco-numero").textContent = numero;
    parte(documento, "disco-unidad").textContent = unidad;
  }
}

function pintarRenglones(documento, porciones, { hoja = false, mensajeVacio = null } = {}) {
  const lugar = parte(documento, "renglones");
  vaciar(lugar);
  if (mensajeVacio) {
    lugar.appendChild(texto(documento, "p", mensajeVacio, "vacio"));
    return;
  }
  if (porciones.length === 0) {
    return;
  }
  const lista = documento.createElement("ul");
  porciones.forEach((porcion, orden) => {
    const item = documento.createElement("li");
    item.setAttribute("class", "imprime");
    // R5: the rows print in from the top, 30ms apart.
    item.setAttribute("style", `animation-delay:${orden * 30}ms`);
    const nombre = porcion.esOtros ? `Otros (${porcion.destino.length})` : porcion.nombre;
    // A row of the last level opens nothing, so it is not a control.
    const fila = documento.createElement(hoja ? "div" : "button");
    fila.setAttribute("class", "fila");
    if (!hoja) {
      fila.setAttribute("type", "button");
      fila.setAttribute("data-abrir", String(orden));
      fila.setAttribute("aria-label",
        `${nombre}, ${porcentaje(porcion.parte)}, ${montoCorto(porcion.monto)}`);
    }
    const muestra = documento.createElement("span");
    muestra.setAttribute("class", "muestra");
    muestra.setAttribute("style", `background:${colorDe(porcion, orden, porciones.length)}`);
    fila.appendChild(muestra);
    fila.appendChild(texto(documento, "span", nombre, "nombre"));
    fila.appendChild(texto(documento, "span", porcentaje(porcion.parte), "pct"));
    fila.appendChild(texto(documento, "span", montoCorto(porcion.monto), "corto"));
    item.appendChild(fila);
    lista.appendChild(item);
  });
  lugar.appendChild(lista);
}

function textoDeFuente(procedencia) {
  const archivo = procedencia.archivo.split("/").pop();
  return "Fuente: Presupuesto Abierto, Ministerio de Economía. Crédito devengado, "
    + `publicado el ${fechaCorta(procedencia.fecha)} en ${archivo}.`;
}

function textoDeCodigos(procedencia) {
  if (!procedencia.codigos) {
    return "";
  }
  return procedencia.codigos.map(({ eje, codigo }) => `${eje}_id=${codigo}`).join(" · ");
}

function pintarPie(documento, { cuenta = null, fuente, codigos = "", archivo = null }) {
  // INV-03: the source is always visible at the foot of the tape. W3: the
  // link to P4 and the codes of the last level stay.
  parte(documento, "pie").hidden = false;
  parte(documento, "cuenta").hidden = cuenta === null;
  if (cuenta) {
    parte(documento, "rotulo").textContent = cuenta.rotulo;
    parte(documento, "total").textContent = montoLargo(cuenta.total);
    parte(documento, "total-texto").textContent = `${montoLargo(cuenta.total)} pesos`;
  }
  escribir(documento, "fuente", fuente);
  escribir(documento, "codigos", codigos);
  const descargar = parte(documento, "descargar");
  descargar.hidden = archivo === null;
  if (archivo !== null) {
    descargar.setAttribute("href", archivo);
  }
}

export function pintarNavegador(documento, vista) {
  // P1 and P2. vista comes from vistaDeNavegador; app.js adds nota.
  pintarBarra(documento, vista);
  pintarGrafico(documento, {
    volver: vista.nivel > 0 ? vista.nivel - 1 : null,
    titulo: vista.titulo,
    frase: vista.frase,
    subtitulo: vista.subtitulo,
    detalle: vista.detalle,
    notas: vista.nota ? [vista.nota] : [],
    anillos: vista.escena,
    disco: partesDelMonto(vista.total),
  });
  pintarRenglones(documento, vista.porciones, vista);
  pintarPie(documento, {
    cuenta: { rotulo: vista.rotulo, total: vista.total },
    fuente: textoDeFuente(vista.procedencia),
    codigos: textoDeCodigos(vista.procedencia),
    archivo: vista.procedencia.archivo,
  });
}

export function pintarAusente(documento, vista) {
  // P2b. W12: no "Volver", because its two exits already go up and back.
  pintarBarra(documento, vista);
  const acciones = [];
  if (vista.ancestro !== null) {
    const subir = boton(documento, "Subir al nivel que sí existe", "principal");
    subir.setAttribute("data-clave", vista.ancestro);
    acciones.push(subir);
  }
  if (vista.origen.ejercicio !== vista.ejercicio) {
    // A shared link gives no exercise of origin. A button back to the year
    // on screen would do nothing, so the breadcrumb is the exit there.
    const volver = boton(documento, `Volver a ${vista.origen.ejercicio}`, "secundario");
    volver.setAttribute("data-anio", String(vista.origen.ejercicio));
    acciones.push(volver);
  }
  pintarGrafico(documento, { titulo: vista.nombre, notas: vista.lineas, acciones, anillos: [] });
  pintarRenglones(documento, []);
  pintarPie(documento, { fuente: textoDeFuente(vista.procedencia), archivo: vista.procedencia.archivo });
}

export function pintarFuentes(documento, vista) {
  // P4. W13: the method in the chart pane, the table of files in the tape.
  pintarBarra(documento, { ejercicio: null, anterior: null, siguiente: null, miga: [] });
  const inicio = boton(documento, "Volver al inicio", "principal");
  inicio.setAttribute("data-clave", "");
  const codigo = texto(documento, "a", "El código de este proyecto");
  codigo.setAttribute("href", REPOSITORIO);
  pintarGrafico(documento, {
    titulo: "De dónde salen estos números", notas: METODO, acciones: [inicio, codigo],
  });

  const lugar = parte(documento, "renglones");
  vaciar(lugar);
  const tabla = documento.createElement("table");
  tabla.setAttribute("class", "fuentes");
  for (const fila of vista.filas) {
    const linea = documento.createElement("tr");
    linea.appendChild(texto(documento, "td", String(fila.ejercicio)));
    const celda = documento.createElement("td");
    const enlace = texto(documento, "a", fila.archivo.split("/").pop());
    enlace.setAttribute("href", fila.archivo);
    celda.appendChild(enlace);
    linea.appendChild(celda);
    linea.appendChild(texto(documento, "td", fechaCorta(fila.publicado)));
    linea.appendChild(texto(documento, "td", estadoDeLaFila(fila)));
    tabla.appendChild(linea);
  }
  lugar.appendChild(tabla);
  // This place is the source itself.
  parte(documento, "pie").hidden = true;
}

export function pintarError(documento, vista) {
  pintarBarra(documento, { ejercicio: null, anterior: null, siguiente: null, miga: [] });
  // The exit is a button and never a link to "#/". From the home route a
  // link to "#/" changes nothing, and it does nothing.
  const inicio = boton(documento, "Volver al inicio", "principal");
  inicio.setAttribute("data-clave", "");
  const fuentes = texto(documento, "a", "De dónde salen estos números");
  fuentes.setAttribute("href", RUTA_DE_FUENTES);
  fuentes.setAttribute("data-fuentes", "");
  pintarGrafico(documento, {
    titulo: vista.mensaje,
    // The technical detail helps a person who reports the fault.
    notas: vista.detalle ? [vista.detalle] : [],
    acciones: [inicio, fuentes],
  });
  pintarRenglones(documento, []);
  // This screen read no manifest, so it names the source and nothing more.
  pintarPie(documento, { fuente: FUENTE_SIN_DATOS });
}
```

- [ ] **Step 4: Run the tests and see them pass**

Run: `node --test test/pantalla.test.mjs`
Expected: PASS, 59 tests.

Run: `node --test`
Expected: PASS, 171 tests, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add site/app/pantalla.js test/pantalla.test.mjs
git commit -F - <<'EOF'
Add the painters of the five places of the frame

A painter writes the parts of the frame for one place, and it holds no
decision. P2b has no Volver. P4 puts the method in the chart pane and
the table of files in the tape pane.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```


---

### Task 10: The frame on screen, and the history of the browser

This task switches the site to the frame. `index.html` holds the frame once. `app.js` answers the history: a step pushes an entry, a load replaces it when the place changes, and `popstate` draws the entry (R12). "Volver" and Escape go up one level (R10, K1). The year arrows and ArrowLeft and ArrowRight change the year, and the path stays (R11, K2). The name of the site goes to the root (R20). The switches change the look with no entry (W9). The rings draw with no motion. Task 11 adds the motion.

The site looks unstyled after this task, because `estilo.css` still styles plan 2. Task 12 rewrites it.

**Tests that this task deletes or changes, and why:**

| Test | File | Change | Why |
|---|---|---|---|
| la pantalla del grupo escribe el total del grupo | pantalla | delete | `dibujarRaiz` goes. Task 8 covers the group view, and Task 9 covers the total in the frame. |
| la vista ofrece solo los ejercicios que estan | pantalla | delete | The strip of years goes (R11). `aniosVecinos` (Task 8) and `ejerciciosDisponibles` (plan 2) cover it. |
| la pantalla nombra el ejercicio, el total y la fuente | pantalla | delete | Task 9 checks the same in the frame. |
| cada fila de la leyenda es un boton de verdad dentro de su li | pantalla | delete | The legend becomes the tape. Task 9 checks the button inside its `li`. |
| la miga conserva los tramos que el navegador saltea | pantalla | delete | R9 names level 1 and the previous level, not every name of the camino. |
| la miga de pan es una lista ordenada de pasos | pantalla | delete | Task 9 checks the `ol`, the `li` and the buttons. |
| la pantalla del ausente dibuja las dos salidas como controles | pantalla | delete | Task 9 checks both exits of P2b. |
| la raiz con un grupo otros nombra el grupo en la miga | pantalla | delete | A group is a level named "Otros" in the pila (Task 8). |
| la raiz sin grupo no dibuja miga | pantalla | delete | Task 9 checks that the root hides the breadcrumb. |
| la pantalla de fuentes ofrece una salida | pantalla | delete | The exit is now a button with `data-clave` (Task 9). |
| la pantalla nombra la licencia y el organismo | pantalla | delete | Task 9 checks both in the chart pane. |
| una hoja con gasto real no dibuja torta vacia | pantalla | delete | UC-02 changed: the last level shows one full ring (D2). Task 8 checks it. |
| resolverPantalla descarta un grupo otros de otro ejercicio | pantalla | delete | The group lives in the entry of the history now. `rutaDeEntrada` (Task 7) drops a group of another place. |
| resolverPantalla descarta un grupo otros de otra clave | pantalla | delete | The same reason. |
| el ultimo tramo de la miga dice que es la pantalla de ahora | pantalla | delete | R9: no crumb names the screen on view, so no crumb is current. |
| la miga de una pantalla ausente no marca ningun tramo | pantalla | delete | The same reason. |
| el tramo que junta nombres repetidos sigue siendo el de esta pantalla | pantalla | delete | The same reason. |
| un grupo otros muestra solo sus claves y lo dice en la miga | pantalla | change | The miga no longer names the group. |
| la pantalla del ausente nombra el ejercicio y las dos salidas | pantalla | change | P2b says two lines now (the sketch of P2b). |
| todas las pantallas enlazan a la pantalla de fuentes | pantalla | change | The link lives once, in the foot of the frame. |
| la pantalla escribe la palabra que corresponde a cada tipo de desviacion | pantalla | change | The word comes from `lineaDeDetalle`. |
| la pantalla del ausente lleva miga de pan | pantalla | change | The breadcrumb of P2b is the short breadcrumb of the ancestor. |
| resolverPantalla salta el nodo de un solo hijo | pantalla | change | `resolverPantalla` loses its third argument. |
| el ausente sin ejercicio de origen no ofrece volver al mismo ejercicio | pantalla | change | It paints with `pintarAusente`. |
| la pantalla de fuentes no dice verificado de lo que no esta | pantalla | change | It paints with `pintarFuentes`. |
| la miga junta los nombres repetidos en un solo tramo | arbol | delete | `migaDePan` goes. Task 2 checks names with accents and case. |
| la miga conserva un nombre repetido que no es adyacente | arbol | delete | `migaDePan` goes. |
| every test of `test/torta.test.mjs` (7) | torta | delete | `torta.js` goes. Task 1 covers the rings. |
| every test of `test/app.test.mjs` (11) | app | rewrite | The frame and the history change the API of `iniciar`. The 11 behaviours stay, and 11 tests of the history join them. |

**Files:**
- Modify: `site/index.html`, `site/app/app.js`, `site/app/pantalla.js`, `site/app/arbol.js`, `test/falso-documento.mjs`, `test/app.test.mjs`, `test/pantalla.test.mjs`, `test/arbol.test.mjs`
- Delete: `site/app/torta.js`, `test/torta.test.mjs`

**Interfaces:**
- Consumes: every module of Tasks 1 to 9.
- Produces:
  - `iniciar({ documento, ventana, historia }) -> { ir(pedido, modo), informar(error), listo() }`. `pedido` is a `ruta` (Task 7). `listo()` returns the promise of the run in progress.
  - `vistaDeAusente(estado, clave, origen) -> { ejercicio, anterior, siguiente, clavePedida, nombre, origen, ancestro, pila, miga, lineas, procedencia }`. `origen` is `{ ejercicio, nombre, monto }`.
  - `resolverPantalla(estado, clave) -> { tipo: "raiz" | "ausente" | "saltar" | "nodo", clave }`.
  - The fakes: `falsoDocumento()` adds `documentElement`, `addEventListener`, `disparar(tipo, evento)`, and `getAttribute`, `closest` and `focus` on an element. `falsaVentana(hash)` adds listeners and `disparar`. `falsaHistoria(ventana, estadoInicial = null)` holds a list of entries with `state`, `pushState`, `replaceState`, `back`, `forward` and `escrituras: [["push" | "replace", hash]]`.
- Deletes: `dibujarRaiz`, `dibujarNodo`, `dibujarAusente`, `dibujarFuentes`, `dibujarError`, `dibujarMiga`, `dibujarTiraDeAnios`, `dibujarProcedencia` and the private helpers `dibujarLeyenda`, `comoPaso`, `dibujarParteDe` of `pantalla.js`; `migaDePan` of `arbol.js`; `torta.js`.


- [ ] **Step 1: Extend the fakes of the tests**

Replace the whole content of `test/falso-documento.mjs`.

```javascript
// A small stand-in for the document, the window and the history, so a test
// needs no browser.

function oyentes() {
  const porTipo = new Map();
  return {
    addEventListener(tipo, oyente) {
      porTipo.set(tipo, [...(porTipo.get(tipo) ?? []), oyente]);
    },
    // A test fires an event with one call, as a browser would.
    disparar(tipo, evento = {}) {
      for (const oyente of porTipo.get(tipo) ?? []) {
        oyente(evento);
      }
    },
  };
}

export function falsoDocumento() {
  const crear = (etiqueta) => ({
    etiqueta,
    atributos: {},
    hijos: [],
    textContent: "",
    setAttribute(nombre, valor) { this.atributos[nombre] = valor; },
    getAttribute(nombre) { return this.atributos[nombre] ?? null; },
    // Only the selectors that app.js uses: one attribute, as "[data-abrir]".
    // The fake element knows no parent, so it answers for itself.
    closest(selector) {
      const nombre = /^\[([\w-]+)\]$/.exec(selector)?.[1];
      return nombre && this.atributos[nombre] !== undefined ? this : null;
    },
    appendChild(hijo) { this.hijos.push(hijo); return hijo; },
    removeChild(hijo) { this.hijos = this.hijos.filter((otro) => otro !== hijo); },
    get firstChild() { return this.hijos[0] ?? null; },
    addEventListener() {},
    focus() {},
  });
  // The frame of index.html holds every part once. The same element comes
  // back for one id, so a test reads what the navigator wrote there.
  const porId = new Map();
  return {
    ...oyentes(),
    documentElement: crear("html"),
    createElement: crear,
    createElementNS: (espacio, etiqueta) => crear(etiqueta),
    getElementById(id) {
      if (!porId.has(id)) {
        porId.set(id, crear("div"));
      }
      return porId.get(id);
    },
  };
}

// The window and the history share one list of entries. pushState and
// replaceState change the hash, and back and forward fire popstate, as a
// browser does.
export function falsaVentana(hash = "#/") {
  return { ...oyentes(), location: { hash } };
}

export function falsaHistoria(ventana, estadoInicial = null) {
  const entradas = [{ hash: ventana.location.hash, estado: estadoInicial }];
  let posicion = 0;
  const escrituras = [];
  const ir = (paso) => {
    const destino = posicion + paso;
    if (destino < 0 || destino >= entradas.length) {
      return;
    }
    posicion = destino;
    ventana.location.hash = entradas[posicion].hash;
    ventana.disparar("popstate", { state: entradas[posicion].estado });
    ventana.disparar("hashchange", {});
  };
  return {
    escrituras,
    entradas,
    get state() { return entradas[posicion].estado; },
    pushState(estado, titulo, hash) {
      entradas.splice(posicion + 1);
      entradas.push({ hash, estado: structuredClone(estado) });
      posicion += 1;
      ventana.location.hash = hash;
      escrituras.push(["push", hash]);
    },
    replaceState(estado, titulo, hash) {
      entradas[posicion] = { hash, estado: structuredClone(estado) };
      ventana.location.hash = hash;
      escrituras.push(["replace", hash]);
    },
    back: () => ir(-1),
    forward: () => ir(1),
  };
}

export function textoDe(elemento) {
  const propio = elemento.textContent || "";
  return [propio, ...elemento.hijos.map(textoDe)].join(" ");
}

// Find every element that carries an attribute, so a test can read the
// controls of a screen and not only its words.
export function controles(elemento, atributo) {
  const propios = elemento.atributos[atributo] === undefined
    ? []
    : [{ texto: elemento.textContent, valor: elemento.atributos[atributo] }];
  return elemento.hijos.reduce(
    (todos, hijo) => todos.concat(controles(hijo, atributo)), propios,
  );
}
```

- [ ] **Step 2: Write the failing tests of the history**

Replace the whole content of `test/app.test.mjs`.

```javascript
import test from "node:test";
import assert from "node:assert/strict";

import { iniciar } from "../site/app/app.js";
import { cargarJson, olvidar } from "../site/app/datos.js";
import { CLAVE_OSCURO } from "../site/app/tema.js";
import {
  controles, falsaHistoria, falsaVentana, falsoDocumento, textoDe,
} from "./falso-documento.mjs";

// A tree of nine institutional levels, so a clave of level 9 makes the
// navigator read one more file. Every nodo keeps two children, so the
// navigator jumps over none of them.
const CADENA = "88-1-0-1-1-1-1-1-1";

function arbolDe(devengado) {
  const indice = {
    "88": {
      n: "Capital Humano", d: devengado, p: devengado, v: devengado, g: 0,
      k: ["1", "9"],
    },
    "88-9": { n: "Otra area", d: 1, p: 1, v: 1, g: 0, k: [] },
    "90": { n: "Deuda", d: 40, p: 40, v: 40, g: 0, k: [] },
    "50": { n: "Economia", d: 10, p: 10, v: 10, g: 0, k: [] },
    // A chain of one child. The visitor never stops on "70". Its 4 are
    // under 4% of the root, so "70" lives in the group "otros" of the root.
    "70": { n: "Vialidad", d: 4, p: 4, v: 4, g: 0, k: ["1"] },
    "70-1": { n: "Rutas", d: 4, p: 4, v: 4, g: 0, k: ["1", "2"] },
    "70-1-1": { n: "Norte", d: 2, p: 2, v: 2, g: 0, k: [] },
    "70-1-2": { n: "Sur", d: 2, p: 2, v: 2, g: 0, k: [] },
  };
  const codigos = CADENA.split("-");
  for (let corte = 2; corte <= codigos.length; corte += 1) {
    const clave = codigos.slice(0, corte).join("-");
    const hoja = corte === codigos.length;
    indice[clave] = {
      n: `Nivel ${corte}`,
      d: devengado,
      p: devengado,
      v: devengado,
      g: 0,
      k: hoja ? ["1", "2"] : [codigos[corte], "9"],
    };
    if (!hoja) {
      indice[`${clave}-9`] = { n: `Hermano ${corte}`, d: 1, p: 1, v: 1, g: 0, k: [] };
    }
  }
  return indice;
}

// In 2025 the Deuda divides in two. In 2026 it does not, so "90-1" is a
// clave that exists in 2025 only.
const ARBOL_2025 = {
  ...arbolDe(60),
  "90": { n: "Deuda", d: 40, p: 40, v: 40, g: 0, k: ["1", "2"] },
  "90-1": { n: "Intereses", d: 30, p: 30, v: 30, g: 0, k: [] },
  "90-2": { n: "Comisiones", d: 10, p: 10, v: 10, g: 0, k: [] },
};

const OBJETO = {
  [`${CADENA}-1`]: { n: "Personal", d: 30, p: 30, v: 30, g: 0, k: [] },
  [`${CADENA}-2`]: { n: "Bienes", d: 30, p: 30, v: 30, g: 0, k: [] },
};

const MANIFIESTO = {
  ejercicios: [
    {
      ejercicio: 2025,
      archivo: "https://ejemplo/credito-anual-2025.zip",
      publicado: "Wed, 08 Jul 2026 10:39:43 GMT",
      total_devengado: 111_000_000,
      verificado: true,
      en_este_artefacto: true,
    },
    {
      ejercicio: 2026,
      archivo: "https://ejemplo/credito-anual-2026.zip",
      publicado: "Tue, 15 Sep 2026 10:35:57 GMT",
      total_devengado: 222_000_000,
      verificado: true,
      en_este_artefacto: true,
    },
  ],
};

const CUERPOS = {
  "data/manifest.json": MANIFIESTO,
  "data/2025/institucional.json": ARBOL_2025,
  "data/2026/institucional.json": arbolDe(70),
  [`data/2025/objeto/${CADENA}.json`]: OBJETO,
  [`data/2026/objeto/${CADENA}.json`]: OBJETO,
};

// A fetch that never touches the network, and that holds a route open until
// the test lets it answer. That is how a slow file becomes a window in which
// a second navigation starts.
function falsoTraer(demorados = []) {
  const llamadas = [];
  const esperando = new Map();
  const sueltos = new Set();
  const traer = (ruta) => {
    llamadas.push(ruta);
    const respuesta = {
      ok: CUERPOS[ruta] !== undefined,
      status: CUERPOS[ruta] === undefined ? 404 : 200,
      json: async () => CUERPOS[ruta],
    };
    if (!demorados.includes(ruta) || sueltos.has(ruta)) {
      return Promise.resolve(respuesta);
    }
    return new Promise((responder) => {
      const cola = esperando.get(ruta) ?? [];
      cola.push(() => responder(respuesta));
      esperando.set(ruta, cola);
    });
  };
  // Open a route, now and from now on. A run that has not reached the fetch
  // yet must not wait for ever.
  const soltar = (ruta) => {
    sueltos.add(ruta);
    for (const responder of esperando.get(ruta) ?? []) {
      responder();
    }
    esperando.set(ruta, []);
  };
  const contar = (ruta) => llamadas.filter((una) => una === ruta).length;
  return { traer, llamadas, soltar, contar };
}

function montar(hash, { demorados = [], estado = null, ventanaExtra = {} } = {}) {
  olvidar();
  const red = falsoTraer(demorados);
  globalThis.fetch = red.traer;
  const documento = falsoDocumento();
  const ventana = { ...falsaVentana(hash), ...ventanaExtra };
  const historia = falsaHistoria(ventana, estado);
  const navegador = iniciar({ documento, ventana, historia });
  const parte = (id) => documento.getElementById(id);
  return {
    ...red,
    documento,
    navegador,
    ventana,
    historia,
    parte,
    titulo: () => parte("titulo").textContent,
    // A click on a painted control, as a browser fires it.
    pulsar: (elemento) => {
      documento.disparar("click", { target: elemento, preventDefault() {} });
      return navegador.listo();
    },
    tecla: (key) => {
      documento.disparar("keydown", { key, target: parte("titulo") });
      return navegador.listo();
    },
  };
}

// The row of the tape whose name is nombre.
function fila(sitio, nombre) {
  const lista = sitio.parte("renglones").hijos[0];
  return lista.hijos.map((item) => item.hijos[0])
    .find((control) => textoDe(control).includes(nombre));
}

// Let every promise that is already settled run its continuations.
function respirar() {
  return new Promise((seguir) => setImmediate(seguir));
}

test("la pantalla de la raiz escribe el total del ejercicio", async () => {
  const sitio = montar("#/2025");
  await sitio.navegador.listo();
  assert.equal(sitio.titulo(), "En qué la gastó el Estado nacional");
  assert.equal(sitio.parte("total-texto").textContent, "111.000.000 pesos");
});

test("una segunda navegacion no deja la pantalla de la primera", async () => {
  // A visitor on a nodo of level 8 goes down, and the object file takes
  // 250 ms. 30 ms later the visitor goes to the root. The first run must
  // not paint over the second one when its file arrives.
  const objeto = `data/2025/objeto/${CADENA}.json`;
  const sitio = montar(`#/2025/${CADENA}`, { demorados: [objeto] });
  await respirar();
  await respirar();

  await sitio.navegador.ir({ anio: 2025, clave: "", grupos: [], desde: null }, "paso");
  sitio.soltar(objeto);
  await respirar();
  await respirar();

  assert.equal(sitio.titulo(), "En qué la gastó el Estado nacional");
  assert.doesNotMatch(textoDe(sitio.parte("renglones")), /Personal/,
    "nothing of the run it left");
});

test("un pedido abandonado que despues falla no borra la pantalla vigente", async () => {
  // The object file fails instead of arriving, after the visitor went to
  // the root. The failure of the first run must not erase the second run.
  olvidar();
  const objeto = `data/2025/objeto/${CADENA}.json`;
  let rechazar;
  const pendiente = new Promise((_resolver, reject) => { rechazar = reject; });
  globalThis.fetch = async (ruta) => (ruta === objeto ? pendiente : {
    ok: CUERPOS[ruta] !== undefined,
    status: CUERPOS[ruta] === undefined ? 404 : 200,
    json: async () => CUERPOS[ruta],
  });
  const documento = falsoDocumento();
  const ventana = falsaVentana(`#/2025/${CADENA}`);
  const historia = falsaHistoria(ventana);
  const navegador = iniciar({ documento, ventana, historia });
  const primera = navegador.listo();
  await respirar();
  await respirar();

  await navegador.ir({ anio: 2025, clave: "", grupos: [], desde: null }, "paso");
  rechazar(new Error("Failed to fetch"));
  await primera;

  assert.equal(documento.getElementById("titulo").textContent, "En qué la gastó el Estado nacional");
  assert.doesNotMatch(textoDe(documento.getElementById("titulo")), /No pudimos/);
});

test("el ejercicio que se abandona no escribe en el historial", async () => {
  const objeto = `data/2025/objeto/${CADENA}.json`;
  const sitio = montar(`#/2025/${CADENA}`, { demorados: [objeto] });
  await respirar();
  await respirar();
  await sitio.navegador.ir({ anio: 2025, clave: "", grupos: [], desde: null }, "paso");
  sitio.soltar(objeto);
  await respirar();
  await respirar();
  assert.deepEqual(sitio.historia.escrituras, [["push", "#/2025"]],
    "the history never names the screen the visitor left");
});

test("dos lecturas de una misma ruta hacen un solo pedido", async () => {
  // A visitor taps the arrow of 2026, a file of 1,1 MB, and taps again
  // before it arrives. Both runs read the same file.
  const lento = "data/2026/institucional.json";
  const sitio = montar("#/2026", { demorados: [lento] });
  const segunda = sitio.navegador.ir({ anio: 2026, clave: "", grupos: [], desde: null }, "carga");
  await respirar();
  sitio.soltar(lento);
  await segunda;
  assert.equal(sitio.contar(lento), 1, "one file, one request");
  assert.equal(sitio.titulo(), "En qué la gastó el Estado nacional");
});

test("un pedido que falla no queda guardado", async () => {
  const sitio = montar("#/2025");
  await sitio.navegador.listo();
  const ausente = "data/2025/objeto/99-9-9-9-9-9-9-9-9.json";
  await assert.rejects(() => cargarJson(ausente, sitio.traer));
  await assert.rejects(() => cargarJson(ausente, sitio.traer));
  assert.equal(sitio.contar(ausente), 2, "a failure is asked for again");
});

test("un enlace a un nodo de un solo hijo reemplaza la entrada", async () => {
  // R12: Back must never return to a nodo that jumps forward again.
  const sitio = montar("#/2025/70");
  await sitio.navegador.listo();
  assert.deepEqual(sitio.historia.escrituras, [["replace", "#/2025/70-1"]]);
  assert.equal(sitio.titulo(), "Rutas");
});

test("una hoja del objeto nombra cada codigo de su camino", async () => {
  const sitio = montar(`#/2025/${CADENA}-1`);
  await sitio.navegador.listo();
  assert.equal(sitio.titulo(), "Personal");
  const codigos = sitio.parte("codigos").textContent;
  assert.match(codigos, /jurisdiccion_id=88/);
  assert.match(codigos, /inciso_id=1/,
    "the source names every code, or the number is not reproducible");
});

test("la region de avisos dice lo que cambio, y no la pantalla entera", async () => {
  const sitio = montar("#/2025");
  await sitio.navegador.listo();
  assert.equal(sitio.parte("aviso").textContent,
    "En qué la gastó el Estado nacional. 111.000.000 pesos.");
});

test("la pantalla de un fallo ofrece una salida que sirve siempre", async () => {
  const sitio = montar("#/2025");
  await sitio.navegador.listo();
  sitio.navegador.informar(new Error("Unexpected end of JSON input"));
  const salida = sitio.parte("acciones").hijos[0];
  assert.deepEqual(controles(salida, "data-clave"), [{ texto: "Volver al inicio", valor: "" }]);
  await sitio.pulsar(salida);
  assert.equal(sitio.titulo(), "En qué la gastó el Estado nacional", "the exit works");
});

test("abrir una parte agrega una entrada, y Volver agrega otra", async () => {
  const sitio = montar("#/2025");
  await sitio.navegador.listo();
  await sitio.pulsar(fila(sitio, "Capital Humano"));
  assert.equal(sitio.titulo(), "Capital Humano");
  assert.equal(sitio.ventana.location.hash, "#/2025/88");
  await sitio.pulsar(sitio.parte("volver"));
  assert.equal(sitio.titulo(), "En qué la gastó el Estado nacional");
  // W6: "Volver" is a step, so Back returns to Capital Humano.
  assert.deepEqual(sitio.historia.escrituras,
    [["replace", "#/2025"], ["push", "#/2025/88"], ["push", "#/2025"]]);
});

test("otros agrega una entrada con el mismo hash y sus claves en el estado", async () => {
  const sitio = montar("#/2025");
  await sitio.navegador.listo();
  await sitio.pulsar(fila(sitio, "Otros (1)"));
  assert.equal(sitio.titulo(), "Otros");
  assert.equal(sitio.ventana.location.hash, "#/2025", "W8: the group is not in the URL");
  assert.deepEqual(sitio.historia.state.grupos, [["70"]]);
  assert.equal(sitio.parte("detalle").textContent, "3,5% del gasto total",
    "R18: 4 of 114 is 3,5%, and nothing more");
});

test("Atras vuelve al grupo otros y a su nodo", async () => {
  const sitio = montar("#/2025");
  await sitio.navegador.listo();
  await sitio.pulsar(fila(sitio, "Otros (1)"));
  await sitio.pulsar(fila(sitio, "Vialidad"));
  assert.equal(sitio.titulo(), "Rutas", "the skip of Vialidad lands on Rutas");
  sitio.historia.back();
  await sitio.navegador.listo();
  assert.equal(sitio.titulo(), "Otros", "Back keeps the group");
  sitio.historia.back();
  await sitio.navegador.listo();
  assert.equal(sitio.titulo(), "En qué la gastó el Estado nacional");
  sitio.historia.forward();
  await sitio.navegador.listo();
  assert.equal(sitio.titulo(), "Otros");
  assert.equal(sitio.historia.entradas.length, 3, "Back and Forward write no entry");
});

test("una entrada con un grupo que ya no existe dibuja el nodo y se reemplaza", async () => {
  const sitio = montar("#/2025", {
    estado: { anio: 2025, clave: "", grupos: [["77", "78"]], desde: null },
  });
  await sitio.navegador.listo();
  assert.equal(sitio.titulo(), "En qué la gastó el Estado nacional");
  assert.deepEqual(sitio.historia.state.grupos, []);
  assert.deepEqual(sitio.historia.escrituras, [["replace", "#/2025"]]);
});

test("el arco encendido y la miga suben al nivel que nombran", async () => {
  const sitio = montar("#/2025/88-1-0-1");
  await sitio.navegador.listo();
  // The pila: Inicio, Capital Humano, Nivel 2, Nivel 3, Nivel 4.
  assert.match(sitio.parte("anillos").innerHTML, /data-subir="3"/, "A12: the thin ring");
  assert.match(sitio.parte("anillos").innerHTML, /data-subir="1"/, "A13: the hairline ring");
  const miga = sitio.parte("miga").hijos[0].hijos;
  const nivel1 = miga[1].hijos[0];
  assert.equal(nivel1.textContent, "Capital Humano");
  await sitio.pulsar(nivel1);
  assert.equal(sitio.titulo(), "Capital Humano");
  assert.equal(sitio.historia.escrituras.at(-1)[0], "push");
});

test("las flechas del anio conservan el camino y cierran el grupo", async () => {
  const sitio = montar("#/2025/88");
  await sitio.navegador.listo();
  await sitio.pulsar(fila(sitio, "Otros (1)"));
  assert.equal(sitio.titulo(), "Otros");
  await sitio.pulsar(sitio.parte("anio-siguiente"));
  assert.equal(sitio.ventana.location.hash, "#/2026/88", "C17: the path stays");
  assert.equal(sitio.titulo(), "Capital Humano", "W5: the group closes");
  assert.equal(sitio.parte("anio-siguiente").disabled, true, "R11: 2026 is the end");
});

test("un anio donde el camino no existe muestra P2b, y Volver a vuelve", async () => {
  const sitio = montar("#/2025/90-1");
  await sitio.navegador.listo();
  await sitio.pulsar(sitio.parte("anio-siguiente"));
  assert.equal(sitio.ventana.location.hash, "#/2026/90-1");
  assert.equal(sitio.titulo(), "Intereses");
  assert.equal(sitio.parte("volver").hidden, true, "W12");
  assert.match(textoDe(sitio.parte("nota")), /En 2025 gastó 30,0 millones\./);
  const volverA = controles(sitio.parte("acciones"), "data-anio");
  assert.deepEqual(volverA, [{ texto: "Volver a 2025", valor: "2025" }]);
  await sitio.pulsar(sitio.parte("acciones").hijos[1]);
  assert.equal(sitio.ventana.location.hash, "#/2025/90-1");
  assert.equal(sitio.titulo(), "Intereses");
});

test("un enlace a una clave ausente abre el ancestro con un aviso", async () => {
  const sitio = montar("#/2026/90-1");
  await sitio.navegador.listo();
  assert.equal(sitio.titulo(), "Deuda");
  assert.equal(textoDe(sitio.parte("nota")).trim(),
    "Ese nivel no existe en 2026; te llevamos al más cercano.");
  assert.deepEqual(sitio.historia.escrituras, [["replace", "#/2026/90"]]);
});

test("Escape sube un nivel y las flechas del teclado cambian el anio", async () => {
  const sitio = montar("#/2025/88");
  await sitio.navegador.listo();
  await sitio.tecla("ArrowRight");
  assert.equal(sitio.ventana.location.hash, "#/2026/88");
  await sitio.tecla("ArrowRight");
  assert.equal(sitio.ventana.location.hash, "#/2026/88", "K2 does nothing at the end");
  await sitio.tecla("Escape");
  assert.equal(sitio.ventana.location.hash, "#/2026");
  await sitio.tecla("Escape");
  assert.equal(sitio.historia.entradas.length, 3, "Escape at the root does nothing");
});

test("el nombre del sitio vuelve a la raiz del anio en pantalla", async () => {
  const sitio = montar("#/2026/88");
  await sitio.navegador.listo();
  sitio.parte("sitio").setAttribute("data-clave", "");
  await sitio.pulsar(sitio.parte("sitio"));
  assert.equal(sitio.ventana.location.hash, "#/2026");
});

test("el enlace a las fuentes abre P4 y Volver al inicio vuelve", async () => {
  const sitio = montar("#/2026/88");
  await sitio.navegador.listo();
  const enlace = sitio.parte("fuentes-enlace");
  enlace.setAttribute("data-fuentes", "");
  await sitio.pulsar(enlace);
  assert.equal(sitio.ventana.location.hash, "#/fuentes");
  assert.equal(sitio.titulo(), "De dónde salen estos números");
  await sitio.pulsar(sitio.parte("acciones").hijos[0]);
  assert.equal(sitio.ventana.location.hash, "#/2026", "the root of the last year on screen");
});

test("un interruptor cambia el aspecto y no escribe en el historial", async () => {
  const guardado = {};
  const sitio = montar("#/2025", {
    ventanaExtra: {
      localStorage: { getItem: (clave) => guardado[clave] ?? null, setItem: (clave, valor) => { guardado[clave] = valor; } },
      matchMedia: () => ({ matches: false }),
    },
  });
  await sitio.navegador.listo();
  const html = sitio.documento.documentElement;
  assert.equal(html.atributos["data-tema"], "claro");
  const oscuro = sitio.parte("oscuro");
  oscuro.setAttribute("data-interruptor", "oscuro");
  const antes = sitio.historia.escrituras.length;
  await sitio.pulsar(oscuro);
  assert.equal(html.atributos["data-tema"], "oscuro");
  assert.equal(oscuro.atributos["aria-checked"], "true");
  assert.equal(guardado[CLAVE_OSCURO], "true");
  assert.equal(sitio.historia.escrituras.length, antes, "W9: no entry");
});
```

Run: `node --test test/app.test.mjs`
Expected: FAIL, 22 tests, 22 failures, with `TypeError: sitio.navegador.listo is not a function`.

- [ ] **Step 3: Change the tests of the views and delete the tests of the old screens**

In `test/pantalla.test.mjs`, replace this text:

```javascript
import test from "node:test";
import assert from "node:assert/strict";

import {
  aniosVecinos, pilaDe, pintarAusente, pintarBarra, pintarError, pintarFuentes,
  pintarNavegador, rutaDePila, vistaDeError, vistaDeNavegador,
  dibujarAusente, dibujarFuentes, dibujarMiga, dibujarNodo, dibujarRaiz,
  esAusencia, estadoDeLaFila, indiceParaClave, resolverPantalla,
  vistaDeAusente, vistaDeFuentes, vistaDeNodo, vistaDeRaiz,
} from "../site/app/pantalla.js";
```

with:

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  aniosVecinos, esAusencia, estadoDeLaFila, indiceParaClave, lineaDeDetalle, pilaDe,
  pintarAusente, pintarBarra, pintarError, pintarFuentes, pintarNavegador,
  resolverPantalla, rutaDePila, vistaDeAusente, vistaDeError, vistaDeFuentes,
  vistaDeNavegador, vistaDeNodo, vistaDeRaiz,
} from "../site/app/pantalla.js";
```

In `test/pantalla.test.mjs`, delete each of these tests, from `test("` to its closing `});`, with the blank line after it:

- `la pantalla del grupo escribe el total del grupo`
- `la vista ofrece solo los ejercicios que estan`
- `la pantalla nombra el ejercicio, el total y la fuente`
- `cada fila de la leyenda es un boton de verdad dentro de su li`
- `la miga conserva los tramos que el navegador saltea`
- `la miga de pan es una lista ordenada de pasos`
- `la pantalla del ausente dibuja las dos salidas como controles`
- `la raiz con un grupo otros nombra el grupo en la miga`
- `la raiz sin grupo no dibuja miga`
- `la pantalla de fuentes ofrece una salida`
- `la pantalla nombra la licencia y el organismo`
- `una hoja con gasto real no dibuja torta vacia`
- `resolverPantalla descarta un grupo otros de otro ejercicio`
- `resolverPantalla descarta un grupo otros de otra clave`
- `el ultimo tramo de la miga dice que es la pantalla de ahora`
- `la miga de una pantalla ausente no marca ningun tramo`
- `el tramo que junta nombres repetidos sigue siendo el de esta pantalla`

In `test/pantalla.test.mjs`, replace the whole test `un grupo otros muestra solo sus claves y lo dice en la miga` with:

```javascript
test("un grupo otros muestra solo sus claves", () => {
  // app.js passes a subset of the children when the visitor opens "otros".
  // vistaDeNodo must show only that subset.
  const vista = vistaDeNodo(CON_CADENA, "45-1-0", ["45-1-0-8"]);
  assert.deepEqual(vista.porciones.map((porcion) => porcion.nombre), ["Taller"]);
  assert.equal(vista.titulo, "Otros");
});
```

In `test/pantalla.test.mjs`, replace the whole test `la pantalla del ausente nombra el ejercicio y las dos salidas` with:

```javascript
test("la pantalla del ausente nombra el ejercicio y lo que gasto en el de origen", () => {
  const vista = vistaDeAusente(ESTADO, "88-9-9", { ejercicio: 2024, nombre: "Becas", monto: 12 });
  assert.equal(vista.nombre, "Becas");
  assert.deepEqual(vista.lineas, ["Este nivel no existe en 2025.", "En 2024 gastó 12,0 millones."]);
  assert.deepEqual([vista.anterior, vista.siguiente], [2024, null]);
});
```

In `test/pantalla.test.mjs`, replace the whole test `todas las pantallas enlazan a la pantalla de fuentes` with:

```javascript
test("todas las pantallas enlazan a la pantalla de fuentes", () => {
  // UC-06 is a must, and W3 keeps the link. The link lives once, in the foot
  // of the frame, so every place that shows the foot shows the link.
  const marco = readFileSync(new URL("../site/index.html", import.meta.url), "utf8");
  assert.match(marco,
    /<a id="fuentes-enlace" href="#\/fuentes" data-fuentes="">De dónde salen estos números<\/a>/);
});
```

In `test/pantalla.test.mjs`, replace the whole test `la pantalla escribe la palabra que corresponde a cada tipo de desviacion` with:

```javascript
test("la pantalla escribe la palabra que corresponde a cada tipo de desviacion", () => {
  // PALABRA_DE_LA_DESVIACION exists so that no screen shows one concept and
  // names it the other. Assert the written word for both types.
  const alto = lineaDeDetalle(vistaDeNodo(CON_CADENA, "45-1-0"));
  assert.match(alto, /sobre lo aprobado/);
  assert.doesNotMatch(alto, /reasignación/);

  const hondo = { ...ESTADO, indice: {
    "1-2-3-4-5-6-7-8": { n: "Actividad", d: 12, p: 10, v: 13, g: 11, k: [] } } };
  const texto = lineaDeDetalle(vistaDeNodo(hondo, "1-2-3-4-5-6-7-8"));
  assert.match(texto, /de reasignación dentro del proyecto/);
  assert.doesNotMatch(texto, /sobre lo aprobado/);
});
```

In `test/pantalla.test.mjs`, replace the whole test `la pantalla del ausente lleva miga de pan` with:

```javascript
test("la pantalla del ausente lleva miga de pan", () => {
  // A P2b reached by a shared URL has no history behind it. The breadcrumb
  // then goes up to the nearest ancestor and above.
  const vista = vistaDeAusente(ESTADO, "88-9-9", { ejercicio: 2024, monto: 12 });
  assert.deepEqual(vista.miga, [
    { nivel: 0, nombre: "Inicio" },
    { nivel: 1, nombre: "Capital Humano" },
  ]);
  assert.deepEqual(rutaDePila(vista.pila.slice(0, 2)), { clave: "88", grupos: [] });
});
```

In `test/pantalla.test.mjs`, replace the whole test `resolverPantalla salta el nodo de un solo hijo` with:

```javascript
test("resolverPantalla salta el nodo de un solo hijo", () => {
  assert.deepEqual(resolverPantalla(CON_CADENA, "45"), { tipo: "saltar", clave: "45-1-0" });
  assert.deepEqual(resolverPantalla(CON_CADENA, "45-1-0"), { tipo: "nodo", clave: "45-1-0" });
});
```

In `test/pantalla.test.mjs`, replace the whole test `el ausente sin ejercicio de origen no ofrece volver al mismo ejercicio` with:

```javascript
test("el ausente sin ejercicio de origen no ofrece volver al mismo ejercicio", () => {
  // A P2b with no origin gives "Volver a 2025" while on 2025, which is inert.
  const vista = vistaDeAusente(ESTADO, "88-9-9", { ejercicio: 2025 });
  const documento = falsoDocumento();
  pintarAusente(documento, vista);
  assert.equal(controles(documento.getElementById("acciones"), "data-anio").length, 0);
  assert.ok(controles(documento.getElementById("miga"), "data-subir").length > 0,
    "the breadcrumb is the exit");
});
```

In `test/pantalla.test.mjs`, replace the whole test `la pantalla de fuentes no dice verificado de lo que no esta` with:

```javascript
test("la pantalla de fuentes no dice verificado de lo que no esta", () => {
  // The build of one exercise can fail. Its entry stays in the manifest,
  // because its total is the baseline of the next build. The strip of years
  // offers no arrow to it. A journalist who reads "verificado" here looks
  // for a screen that this artifact does not hold.
  const vista = vistaDeFuentes({
    ejercicios: [
      { ejercicio: 2025, archivo: "x/a.zip", publicado: "Wed, 08 Jul 2026 10:39:43 GMT", verificado: true, en_este_artefacto: true },
      { ejercicio: 2026, archivo: "x/b.zip", publicado: "Tue, 15 Sep 2026 10:35:57 GMT", verificado: true, en_este_artefacto: false },
    ],
  });
  assert.deepEqual(vista.filas.map((fila) => estadoDeLaFila(fila)),
    ["verificado", "no está en esta versión del sitio"]);
  const documento = falsoDocumento();
  pintarFuentes(documento, vista);
  const texto = textoDe(documento.getElementById("renglones"));
  assert.match(texto, /8 jul 2026/, "the date reads in Spanish");
  assert.doesNotMatch(texto, /GMT/);
});
```

In `test/arbol.test.mjs`, delete each of these tests, from `test("` to its closing `});`, with the blank line after it:

- `la miga junta los nombres repetidos en un solo tramo`
- `la miga conserva un nombre repetido que no es adyacente`

In `test/arbol.test.mjs`, replace this text:

```javascript
  hijosDe, llano, migaCorta, migaDePan, nivelDe, raices, saltarHijoUnico, totalDe,
```

with:

```javascript
  hijosDe, llano, migaCorta, nivelDe, raices, saltarHijoUnico, totalDe,
```

Delete `test/torta.test.mjs`:

```bash
git rm test/torta.test.mjs
```

Run: `node --test test/pantalla.test.mjs`
Expected: FAIL, 42 tests, 4 failures: the link in `index.html`, the two lines and the breadcrumb of P2b, and `resolverPantalla` with two arguments.

- [ ] **Step 4: Write the frame**

Replace the whole content of `site/index.html`.

```html
<!doctype html>
<html lang="es" data-tema="claro" data-vista="simple">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>En qué la gastan</title>
    <meta name="description"
          content="Un mapa navegable del gasto público del Estado nacional argentino." />
    <link rel="stylesheet" href="estilo.css" />
  </head>
  <body>
    <!-- The frame draws once. app.js writes its parts on every step, so the
         top bar, the chart and the tape stay in place, and a motion can run
         between two places. -->
    <div class="marco">
      <header class="barra">
        <a class="sitio" id="sitio" href="#/" data-clave="">En qué la gastan</a>
        <nav class="miga" id="miga" aria-label="Camino" hidden></nav>
        <span class="empuje"></span>
        <div class="anios" role="group" aria-label="Ejercicio">
          <button type="button" class="flecha" id="anio-anterior" data-anio=""
                  aria-label="Año anterior" disabled>‹</button>
          <span class="anio" id="anio"></span>
          <button type="button" class="flecha" id="anio-siguiente" data-anio=""
                  aria-label="Año siguiente" disabled>›</button>
        </div>
        <div class="interruptores">
          <button type="button" class="interruptor" id="oscuro" role="switch"
                  aria-checked="false" data-interruptor="oscuro"><span class="pista" aria-hidden="true"></span>Oscuro</button>
          <button type="button" class="interruptor" id="billetes" role="switch"
                  aria-checked="false" data-interruptor="billetes"><span class="pista" aria-hidden="true"></span>Billetes</button>
        </div>
      </header>

      <!-- #app carries no aria-live. A live region here would read the whole
           place on every step. #aviso below is stable, and it says only what
           changed. -->
      <main id="app" class="paneles">
        <section class="panel-grafico" aria-labelledby="titulo">
          <div class="cabeza">
            <button type="button" class="volver" id="volver" data-subir="" hidden>
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M16 10H4m5-5-5 5 5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Volver
            </button>
            <h1 id="titulo" tabindex="-1">Cargando el gasto público…</h1>
          </div>
          <p class="frase" id="frase" hidden></p>
          <p class="subtitulo" id="subtitulo" hidden></p>
          <p class="detalle" id="detalle" hidden></p>
          <div class="nota" id="nota" hidden></div>
          <div class="acciones" id="acciones" hidden></div>
          <div class="caja" id="caja">
            <div class="lienzo" id="lienzo">
              <svg id="grafico" viewBox="-1 -1 2 2" aria-hidden="true"><g id="anillos"></g></svg>
              <div class="disco" aria-hidden="true">
                <div class="monto" id="disco">
                  <span class="numero" id="disco-numero"></span>
                  <span class="unidad" id="disco-unidad"></span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="panel-cinta" aria-label="Partidas">
          <div class="renglones" id="renglones"></div>
          <footer class="pie" id="pie">
            <div class="cuenta" id="cuenta" hidden>
              <p class="rotulo" id="rotulo"></p>
              <p class="total"><span class="cifras" id="total" aria-hidden="true"></span><span class="unidad" aria-hidden="true">pesos</span><span class="solo-lectores" id="total-texto"></span></p>
            </div>
            <p class="fuente" id="fuente"></p>
            <p class="codigos" id="codigos" hidden></p>
            <p class="enlaces">
              <a id="descargar" href="" hidden>Descargar el archivo oficial</a>
              <a id="fuentes-enlace" href="#/fuentes" data-fuentes="">De dónde salen estos números</a>
            </p>
          </footer>
        </section>
      </main>
    </div>
    <p id="aviso" role="status" class="solo-lectores"></p>
    <script type="module" src="app/app.js"></script>
  </body>
</html>
```

- [ ] **Step 5: Change the views and delete the old screens**

In `site/app/pantalla.js`, replace this text:

```javascript
// Turn the data of one exercise into what a screen says, and then into
// elements.
//
// Every decision lives in the functions that give a view. The functions that
// draw hold no decision, so a test reads a view without a browser.
```

with:

```javascript
// Turn the data of one exercise into what a screen says, and then into the
// parts of the frame.
//
// Every decision lives in the functions that give a view. The painters hold
// no decision, so a test reads a view without a browser.
```

In `site/app/pantalla.js`, replace this text:

```javascript
import {
  hijosDe, migaCorta, migaDePan, nivelDe, NIVELES_INSTITUCIONALES, raices,
  saltarHijoUnico, totalDe,
} from "./arbol.js";
```

with:

```javascript
import {
  hijosDe, migaCorta, nivelDe, NIVELES_INSTITUCIONALES, raices, saltarHijoUnico,
  totalDe,
} from "./arbol.js";
```

In `site/app/pantalla.js`, replace this text:

```javascript
import { NOMBRE_OTROS, porcionesDe } from "./porciones.js";
```

with:

```javascript
import { porcionesDe } from "./porciones.js";
```

In `site/app/pantalla.js`, delete this line:

```javascript
import { dibujarTorta } from "./torta.js";
```

In `site/app/pantalla.js`, delete each of these functions, from its first line to its closing brace, with the blank line after it. Keep every other function and constant.

- `dibujarLeyenda`
- `dibujarTiraDeAnios`
- `comoPaso`
- `dibujarMiga`
- `dibujarProcedencia`
- `dibujarParteDe`
- `dibujarRaiz`
- `dibujarNodo`
- `dibujarFuentes`
- `dibujarError`
- `dibujarAusente`

In `site/app/pantalla.js`, replace the whole function `vistaDeRaiz`, from its first line to its closing brace, with:

```javascript
export function vistaDeRaiz(estado, grupo = null) {
  const { indice, entrada, ejercicio } = estado;
  const totales = totalesDeLaRaiz(indice);
  const comoNodo = { n: "", d: totales.d, p: totales.p, v: totales.v, g: totales.g };
  const base = {
    ejercicio,
    titulo: TITULO_DE_LA_RAIZ,
    // The headline shows the verified total from the manifest, not the sum.
    // Each jurisdiccion below rounds to 6 decimals of a million pesos.
    // Summing 15 of them can drift from the true total by a few pesos.
    // Never replace this line with totales.d for that reason.
    total: entrada.total_devengado / 1_000_000,
    parteDe: null,
    parteDelTotal: null,
    ejecucion: ejecucionDe(comoNodo),
    desviacion: desviacionDe(comoNodo, ""),
    porciones: porcionesDe(indice, totales.claves, "d").porciones,
    procedencia: procedenciaDe(entrada, indice, ""),
  };
  if (!grupo) {
    return base;
  }
  return vistaDeGrupo(base, grupo, indice, "del gasto del Estado nacional",
    totales.d);
}
```

In `site/app/pantalla.js`, replace the whole function `vistaDeNodo`, from its first line to its closing brace, with:

```javascript
export function vistaDeNodo(estado, clave, grupo = null) {
  const { indice, entrada, ejercicio } = estado;
  const nodo = indice[clave];
  // A nodo of level 9 lists object codes whose file may be absent.
  const hijos = hijosDe(indice, clave).filter((hijo) => indice[hijo]);
  const { total, porciones } = hijos.length > 0
    ? porcionesDe(indice, hijos, "d")
    : { total: nodo.d, porciones: [] };
  const raizTotal = totalDe(indice, raices(indice), "d");
  const base = {
    ejercicio,
    clave,
    titulo: nodo.n,
    total: nodo.d,
    parteDe: null,
    parteDelTotal: raizTotal > 0 ? nodo.d / raizTotal : null,
    ejecucion: ejecucionDe(nodo),
    desviacion: desviacionDe(nodo, clave),
    porciones: total > 0 ? porciones : [],
    sinEjecucion: nodo.d === 0,
    procedencia: procedenciaDe(entrada, indice, clave),
  };
  if (!grupo) {
    return base;
  }
  return {
    ...vistaDeGrupo(base, grupo, indice, `de ${nodo.n}`, raizTotal),
    sinEjecucion: false,
  };
}
```

In `site/app/pantalla.js`, replace the whole function `vistaDeAusente`, from its first line to its closing brace, with:

```javascript
export function vistaDeAusente(estado, clave, origen) {
  // P2b. origen is the exercise where the visitor saw this clave:
  // { ejercicio, nombre, monto }.
  const { ejercicio, indice } = estado;
  const ancestro = ancestroQueExiste(indice, clave);
  const nombre = origen.nombre ?? clave.split("-").at(-1);
  const pila = pilaDe(indice, ancestro ?? "");
  const lineas = [`Este nivel no existe en ${ejercicio}.`];
  if (origen.monto !== undefined && origen.ejercicio !== ejercicio) {
    const { numero, unidad } = partesDelMonto(origen.monto);
    lineas.push(`En ${origen.ejercicio} gastó ${numero} ${unidad}.`);
  }
  return {
    ejercicio,
    ...aniosVecinos(estado.disponibles, ejercicio),
    clavePedida: clave,
    nombre,
    origen,
    ancestro,
    // A shared link can land here with no history. The breadcrumb then
    // moves the visitor up the tree, to the nearest ancestor and above.
    pila,
    miga: migaCorta([...pila.map((nivel) => nivel.nombre), nombre]),
    lineas,
    procedencia: procedenciaDe(estado.entrada, indice, ""),
  };
}
```

In `site/app/pantalla.js`, replace the whole function `resolverPantalla`, from its first line to its closing brace, with:

```javascript
export function resolverPantalla(estado, clave) {
  // The one decision of the navigator: what to draw for a requested clave.
  // app.js keeps only the DOM and the history, so a test reads this rule.
  if (clave === "") {
    return { tipo: "raiz", clave: "" };
  }
  if (!estado.indice[clave]) {
    return { tipo: "ausente", clave };
  }
  // The visitor never lands on a nodo with one child. A chain that crosses
  // the object level needs a second pass, because the index of the new clave
  // is not loaded yet. app.js repeats until the destino stops moving.
  const destino = saltarHijoUnico(estado.indice, clave);
  if (destino !== clave) {
    return { tipo: "saltar", clave: destino };
  }
  return { tipo: "nodo", clave };
}
```

In `site/app/arbol.js`, replace the whole function `saltarHijoUnico`, from its first line to its closing brace, with:

```javascript
export function saltarHijoUnico(indice, clave) {
  // 79% of the nodos of a real exercise hold one child. Such a nodo shows a
  // ring of one colour, and it repeats the screen before it. The source at
  // the foot names every code of the camino, so no code is lost.
  let actual = clave;
  while (indice[actual] && indice[actual].k.length === 1) {
    actual = `${actual}-${indice[actual].k[0]}`;
  }
  return actual;
}
```

In `site/app/arbol.js`, delete each of these functions, from its first line to its closing brace, with the blank line after it. Keep every other function and constant.

- `migaDePan`

Delete `site/app/torta.js`:

```bash
git rm site/app/torta.js
```

- [ ] **Step 6: Answer the history in app.js**

Replace the whole content of `site/app/app.js`.

```javascript
// Join the modules, and answer the history of the browser.
//
// This module holds the DOM, the history and the switches, and no rule of
// the navigator. pantalla.js holds the views, and ruta.js holds the model of
// the history, so a test reads every rule there.
//
// iniciar takes the document, the window and the history as arguments. The
// module therefore loads without a browser, and a test drives the whole
// loop with the fakes of test/falso-documento.mjs.

import { cargarInstitucional, cargarManifiesto } from "./datos.js";
import { montoLargo } from "./formato.js";
import {
  esAusencia, expandirMiga, indiceParaClave, pilaDe, pintarAusente, pintarError,
  pintarFuentes, pintarNavegador, resolverPantalla, rutaDePila, vistaDeAusente,
  vistaDeError, vistaDeFuentes, vistaDeNavegador,
} from "./pantalla.js";
import {
  ancestroQueExiste, ejercicioDeEntrada, ejerciciosDisponibles, entradaDe,
  escrituraDe, rutaDeEntrada,
} from "./ruta.js";
import { aplicarTema, cambiarTema, leerTema } from "./tema.js";

function almacenDe(ventana) {
  // The getter of localStorage throws when the browser blocks the storage.
  try {
    return ventana.localStorage ?? null;
  } catch {
    return null;
  }
}

export function iniciar({ documento, ventana, historia }) {
  // The live region lives outside #app, and it says only what changed.
  const aviso = documento.getElementById("aviso");
  const almacen = almacenDe(ventana);
  const prefiere = (consulta) => Boolean(ventana.matchMedia?.(consulta).matches);
  let tema = leerTema(almacen, prefiere);
  aplicarTema(documento, tema);

  // The place on screen: { ruta, lugar, pila, vista, indice }. lugar is
  // "navegador", "ausente", "fuentes" or "error".
  let actual = null;
  // The last exercise on screen. P4 and the failure screen belong to no
  // exercise, and "Volver al inicio" goes back to this one.
  let ultimoAnio = null;

  // A popstate can start a second run while the first one waits for a file.
  // Both runs would write to the frame. Every run takes a number, and only
  // the newest one writes.
  let generacion = 0;
  let enCurso = Promise.resolve();

  // popstate and hashchange both fire on one change of the hash. The key of
  // the entry that the page answered lets the second event do nothing.
  let atendida = null;
  const llaveDe = (hash, estado) => `${hash}|${JSON.stringify(estado ?? null)}`;

  function anunciar(texto) {
    if (aviso) {
      aviso.textContent = texto;
    }
  }

  function escribirHistoria(modo, ruta) {
    const final = entradaDe(ruta);
    const actualEntrada = { hash: ventana.location.hash, estado: historia.state };
    const escritura = escrituraDe(modo, actualEntrada, final);
    if (escritura === "push") {
      historia.pushState(final.estado, "", final.hash);
    } else if (escritura === "replace") {
      historia.replaceState(final.estado, "", final.hash);
    }
    atendida = llaveDe(final.hash, final.estado);
  }

  async function indiceDe(ejercicio, institucional, clave) {
    // esAusencia in pantalla.js holds the rule, and a test reads it there.
    try {
      return await indiceParaClave(ejercicio, institucional, clave);
    } catch (error) {
      if (esAusencia(error)) {
        return institucional;
      }
      throw error;
    }
  }

  async function correr(pedido, modo, vigente) {
    const manifiesto = await cargarManifiesto();
    if (!vigente()) {
      return;
    }

    if (pedido.fuentes) {
      escribirHistoria(modo, pedido);
      pintarFuentes(documento, vistaDeFuentes(manifiesto));
      anunciar("De dónde salen estos números");
      actual = { ruta: pedido, lugar: "fuentes" };
      return;
    }

    const disponibles = ejerciciosDisponibles(manifiesto);
    const valido = disponibles.includes(pedido.anio);
    const ejercicio = valido ? pedido.anio : ejercicioDeEntrada(disponibles);
    // UC-08: a year that is not published opens the root of the entry year.
    let clave = valido ? pedido.clave : "";
    const grupos = valido ? pedido.grupos : [];
    const entrada = manifiesto.ejercicios.find((fila) => fila.ejercicio === ejercicio);
    const institucional = await cargarInstitucional(ejercicio);
    if (!vigente()) {
      return;
    }
    const base = { ejercicio, entrada, indice: institucional, disponibles };
    // A change of year carries the exercise of origin. Only then does an
    // absent clave show P2b. A link or Back to an absent clave opens the
    // nearest ancestor, with one line that says so.
    const desdeOtroAnio = Boolean(pedido.desde) && pedido.desde.anio !== ejercicio;

    let estado = base;
    let decision = null;
    let nota = "";
    for (;;) {
      estado = { ...base, indice: await indiceDe(ejercicio, institucional, clave) };
      if (!vigente()) {
        return;
      }
      decision = resolverPantalla(estado, clave);
      if (decision.tipo === "saltar") {
        clave = decision.clave;
      } else if (decision.tipo === "ausente" && !desdeOtroAnio) {
        nota = `Ese nivel no existe en ${ejercicio}; te llevamos al más cercano.`;
        clave = ancestroQueExiste(estado.indice, clave) ?? "";
      } else {
        break;
      }
    }
    ultimoAnio = ejercicio;

    if (decision.tipo === "ausente") {
      const ruta = { anio: ejercicio, clave, grupos: [], desde: pedido.desde };
      escribirHistoria(modo, ruta);
      const vista = vistaDeAusente(estado, clave, {
        ejercicio: pedido.desde.anio, nombre: pedido.desde.nombre, monto: pedido.desde.monto,
      });
      pintarAusente(documento, vista);
      anunciar(`${vista.nombre} no existe en el ejercicio ${ejercicio}`);
      actual = { ruta, lugar: "ausente", pila: vista.pila, vista, indice: estado.indice };
      return;
    }

    // A group that the data no longer has drops out of the pila. The route
    // of the pila then differs from the entry, and the entry is replaced.
    const pila = pilaDe(estado.indice, clave, grupos);
    const ruta = { anio: ejercicio, ...rutaDePila(pila), desde: null };
    escribirHistoria(modo, ruta);
    const vista = { ...vistaDeNavegador(estado, pila), nota };
    pintarNavegador(documento, vista);
    anunciar(`${vista.titulo}. ${montoLargo(vista.total)} pesos.`);
    actual = { ruta, lugar: "navegador", pila, vista, indice: estado.indice };
  }

  function ir(pedido, modo) {
    generacion += 1;
    const mia = generacion;
    const vigente = () => mia === generacion;
    // A stale run must write nothing, whether it succeeds or fails.
    enCurso = correr(pedido, modo, vigente).catch((error) => {
      if (vigente()) {
        informar(error);
      }
    });
    return enCurso;
  }

  function informar(error) {
    pintarError(documento, vistaDeError(error));
    anunciar("No pudimos mostrar esta pantalla.");
    actual = { ruta: null, lugar: "error" };
  }

  // ---- The steps of the visitor. Every step pushes one entry (W6). ----

  function abrir(orden) {
    if (actual?.lugar !== "navegador" || actual.vista.hoja) {
      return enCurso;
    }
    const porcion = actual.pila.at(-1).porciones[orden];
    if (!porcion) {
      return enCurso;
    }
    const { anio, clave, grupos } = actual.ruta;
    // UC-03: a group keeps the hash of its nodo, and its claves go to state.
    return ir(porcion.esOtros
      ? { anio, clave, grupos: [...grupos, porcion.destino], desde: null }
      : { anio, clave: porcion.destino[0], grupos: [], desde: null }, "paso");
  }

  function subir(nivel) {
    // On P2b the pila ends at the nearest ancestor, and every level of it
    // is a way up. On P1 and P2 the last level is the screen on view.
    if (!actual?.pila) {
      return enCurso;
    }
    const limite = actual.lugar === "ausente" ? actual.pila.length : actual.pila.length - 1;
    if (!(nivel >= 0 && nivel < limite)) {
      return enCurso;
    }
    const arriba = rutaDePila(actual.pila.slice(0, nivel + 1));
    return ir({ anio: actual.ruta.anio, ...arriba, desde: null }, "paso");
  }

  function volver() {
    // R10 and K1: one level up, or out of the group. W12: P2b has none.
    if (actual?.lugar !== "navegador" || actual.pila.length < 2) {
      return enCurso;
    }
    return subir(actual.pila.length - 2);
  }

  function cambiarAnio(anio) {
    // R11: the path stays (C17), and W5: an open group closes.
    if ((actual?.lugar !== "navegador" && actual?.lugar !== "ausente") || !anio) {
      return enCurso;
    }
    const { clave } = actual.ruta;
    let desde = null;
    if (actual.lugar === "ausente") {
      desde = actual.ruta.desde;
    } else if (clave !== "") {
      const nodo = actual.indice[clave];
      desde = { anio: actual.ruta.anio, nombre: nodo.n, monto: nodo.d };
    }
    return ir({ anio, clave, grupos: [], desde }, "paso");
  }

  function irAClave(clave) {
    return ir({ anio: ultimoAnio, clave, grupos: [], desde: null }, "paso");
  }

  function conmutar(interruptor) {
    // W9: a switch changes the look, never the place, and writes no entry.
    tema = cambiarTema(tema, interruptor, almacen);
    const aplicar = () => aplicarTema(documento, tema);
    if (!documento.startViewTransition || prefiere("(prefers-reduced-motion: reduce)")) {
      aplicar();
      return;
    }
    // R13: a crossfade of 200ms. A hidden tab skips the transition, and the
    // change still applies. The two promises then reject, and nobody needs
    // to hear it.
    const transicion = documento.startViewTransition(aplicar);
    transicion.ready.catch(() => {});
    transicion.finished.catch(() => {});
  }

  function manejarClick(evento) {
    const objetivo = evento.target;
    if (!objetivo?.closest) {
      return enCurso;
    }
    const control = (atributo) => objetivo.closest(`[${atributo}]`);
    const valor = (atributo) => control(atributo)?.getAttribute(atributo);
    // A link opened with a modifier goes to a new tab, as the visitor asks.
    const enOtraPestania = evento.metaKey || evento.ctrlKey || evento.shiftKey;

    if (control("data-expandir")) {
      expandirMiga(control("data-expandir"));
      return enCurso;
    }
    if (control("data-interruptor")) {
      conmutar(valor("data-interruptor"));
      return enCurso;
    }
    if (control("data-abrir")) {
      return abrir(Number(valor("data-abrir")));
    }
    if (control("data-subir")) {
      return subir(Number(valor("data-subir")));
    }
    if (control("data-anio")) {
      return cambiarAnio(Number(valor("data-anio")));
    }
    if (control("data-clave") && !enOtraPestania) {
      evento.preventDefault?.();
      return irAClave(valor("data-clave"));
    }
    if (control("data-fuentes") && !enOtraPestania) {
      evento.preventDefault?.();
      return ir({ fuentes: true }, "paso");
    }
    return enCurso;
  }

  function manejarTecla(evento) {
    if (evento.altKey || evento.ctrlKey || evento.metaKey || evento.shiftKey) {
      return enCurso;
    }
    if (evento.key === "Escape") {
      return volver();
    }
    // K2: the arrow at an end has no year, so the key does nothing there.
    if (evento.key === "ArrowLeft") {
      return cambiarAnio(actual?.vista?.anterior);
    }
    if (evento.key === "ArrowRight") {
      return cambiarAnio(actual?.vista?.siguiente);
    }
    return enCurso;
  }

  function alCambiarLaEntrada() {
    const llave = llaveDe(ventana.location.hash, historia.state);
    if (llave === atendida) {
      return enCurso;
    }
    atendida = llave;
    return ir(rutaDeEntrada(ventana.location.hash, historia.state), "carga");
  }

  documento.addEventListener("click", (evento) => { manejarClick(evento); });
  documento.addEventListener("keydown", (evento) => { manejarTecla(evento); });
  ventana.addEventListener("popstate", alCambiarLaEntrada);
  ventana.addEventListener("hashchange", alCambiarLaEntrada);

  alCambiarLaEntrada();
  return { ir, informar, listo: () => enCurso };
}

if (typeof document !== "undefined") {
  iniciar({ documento: document, ventana: window, historia: history });
}
```

- [ ] **Step 7: Run the tests and see them pass**

Run: `node --test test/app.test.mjs`
Expected: PASS, 22 tests.

Run: `node --test test/pantalla.test.mjs`
Expected: PASS, 42 tests.

Run: `node --test test/arbol.test.mjs`
Expected: PASS, 11 tests.

Run: `node --test`
Expected: PASS, 156 tests, 0 failures.

Run: `grep -rn "dibujarRaiz\|dibujarNodo\|dibujarAusente\|dibujarMiga\|dibujarTorta\|migaDePan\|torta\.js" site/app test`
Expected: no output.

- [ ] **Step 8: Commit**

`git rm` in Steps 3 and 5 already staged the two deleted files.

```bash
git add site/index.html site/app/app.js site/app/pantalla.js site/app/arbol.js test/falso-documento.mjs test/app.test.mjs test/pantalla.test.mjs test/arbol.test.mjs
git commit -F - <<'EOF'
Draw every place in one frame, and make every step an entry of the history

The page holds the frame once, and a painter writes its parts. A step
pushes an entry, and a load that changes the place replaces it. Volver,
Escape, the year arrows and the arrow keys move the visitor. The pie
chart and the full breadcrumb go.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```


---

### Task 11: The motion of the frame

A painter draws the end state first. The motion then starts from the state before, and its last frame draws the end state again, with every destination. A step down or up interpolates the rings (R4). The first load grows the main ring once (W4). A change of year slides the panes, and the rings do not move (R11). The total rolls (R5). A slow file writes "Cargando…" in the disc after 300ms (W10). A tap, a key or a pointer on the chart ends a running motion at once. With reduced motion the chart fades in 150ms. The first paint of the ring leaves a performance mark (the KPI of UC-01).

**Files:**
- Modify: `site/app/pantalla.js`, `site/app/app.js`
- Test: `test/pantalla.test.mjs`, `test/app.test.mjs`

**Interfaces:**
- Consumes: `interpolar`, `desdeCero`, `tamanioDelDisco`, `RADIO_DEL_DISCO` (Tasks 1, 4); `crearMotor`, `ruedasDelOdometro`, `cifrasDe`, `htmlDelOdometro` (Task 6); `direccionEntre` (Task 7).
- Produces:
  - `ESPERA_DE_CARGA = 300`.
  - `pintarCargando(documento)`.
  - `ajustarDisco(documento)`: sets `--fs` on `#disco`. It does nothing with no layout.
  - `deslizar(documento, haciaElPasado)`: sets `data-desliza="izquierda" | "derecha"` on `#app`.
  - `moverNavegador(documento, vista, { motor, antes = null, direccion, reducido = false })`. `antes` is the view on screen before, or `null`.
  - The mark `enquelagastan-anillo`, one time per load, on `performance`.
  - `#total` now holds the markup of the odometer, not text. `#total-texto` keeps the text for a screen reader.


- [ ] **Step 1: Write the failing tests**

In `test/pantalla.test.mjs`, replace this text:

```javascript
  aniosVecinos, esAusencia, estadoDeLaFila, indiceParaClave, lineaDeDetalle, pilaDe,
```

with:

```javascript
  aniosVecinos, esAusencia, estadoDeLaFila, indiceParaClave, lineaDeDetalle, moverNavegador, pilaDe,
```

In `test/pantalla.test.mjs`, replace this text:

```javascript
import { migaCorta } from "../site/app/arbol.js";
```

with:

```javascript
import { svgDeEscena } from "../site/app/anillos.js";
import { migaCorta } from "../site/app/arbol.js";
```

Append to the end of `test/pantalla.test.mjs`:

```javascript
// ---- The motion of the frame ----------------------------------------------

// A motor that keeps the motion it gets, so a test runs any frame by hand.
function motorQueGuarda() {
  const motor = { pedido: null, animar(pedido) { motor.pedido = pedido; } };
  return motor;
}

test("el primer dibujo hace crecer el anillo y termina con cada destino", () => {
  const documento = falsoDocumento();
  const vista = vistaDeNavegador(ESTADO, pilaDe(ESTADO.indice, ""));
  pintarNavegador(documento, vista);
  const motor = motorQueGuarda();
  moverNavegador(documento, vista, { motor, direccion: "inicio" });
  const anillos = enMarco(documento, "anillos");
  assert.doesNotMatch(anillos.innerHTML, /data-abrir/, "W4: the first frame is the ring at zero");
  assert.equal(motor.pedido.reducido, false);
  motor.pedido.fin();
  assert.equal(anillos.innerHTML, svgDeEscena(vista.escena), "the last frame has every destination");
});

test("el total rueda desde el total de antes", () => {
  const documento = falsoDocumento();
  const antes = vistaDeNavegador(ESTADO, pilaDe(ESTADO.indice, ""));
  const vista = vistaDeNavegador(ESTADO, pilaDe(ESTADO.indice, "88-1"));
  const motor = motorQueGuarda();
  moverNavegador(documento, { ...vista, total: 200 }, { motor, antes: { ...antes, total: 100 }, direccion: "abajo" });
  // Half way from 100 to 200 millones: 150.000.000 pesos, nine wheels.
  motor.pedido.paso(0.5);
  const total = enMarco(documento, "total").innerHTML;
  assert.equal(total.match(/class="rueda"/g).length, 9);
  assert.match(total, /^<span class="rueda"><span class="tira" style="transform:translateY\(-1\.200em\)">/);
});

test("un cambio de anio desliza los paneles y no mueve los anillos", () => {
  const documento = falsoDocumento();
  const vista = vistaDeNavegador(ESTADO, pilaDe(ESTADO.indice, ""));
  pintarNavegador(documento, vista);
  const motor = motorQueGuarda();
  moverNavegador(documento, vista, { motor, antes: { ...vista, ejercicio: 2026 }, direccion: "anio" });
  assert.equal(enMarco(documento, "app").atributos["data-desliza"], "izquierda",
    "R11: an older year comes from the left");
  assert.equal(enMarco(documento, "anillos").innerHTML, svgDeEscena(vista.escena));
});

test("con movimiento reducido el grafico se funde", () => {
  const documento = falsoDocumento();
  const vista = vistaDeNavegador(ESTADO, pilaDe(ESTADO.indice, ""));
  const motor = motorQueGuarda();
  moverNavegador(documento, vista, { motor, direccion: "inicio", reducido: true });
  assert.equal(enMarco(documento, "grafico").atributos.style, "opacity:0");
  assert.equal(motor.pedido.reducido, true);
  motor.pedido.fin();
  assert.equal(enMarco(documento, "grafico").atributos.style, "");
});

test("el mismo lugar no mueve nada", () => {
  const motor = motorQueGuarda();
  const vista = vistaDeNavegador(ESTADO, pilaDe(ESTADO.indice, ""));
  moverNavegador(falsoDocumento(), vista, { motor, antes: vista, direccion: "igual" });
  assert.equal(motor.pedido, null);
});
```

Append to the end of `test/app.test.mjs`:

```javascript
test("un toque durante el movimiento lo termina, y la marca sale una vez", async () => {
  const cuadros = [];
  const marcas = [];
  const sitio = montar("#/2025", {
    ventanaExtra: {
      requestAnimationFrame: (funcion) => { cuadros.push(funcion); },
      performance: { now: () => 0, mark: (nombre) => { marcas.push(nombre); } },
    },
  });
  await sitio.navegador.listo();
  assert.doesNotMatch(sitio.parte("anillos").innerHTML, /data-abrir/, "the ring is growing");
  sitio.documento.disparar("pointerdown", {});
  assert.match(sitio.parte("anillos").innerHTML, /data-abrir="0"/, "R4: the motion ends at once");
  await sitio.pulsar(fila(sitio, "Capital Humano"));
  assert.deepEqual(marcas, ["enquelagastan-anillo"]);
});

test("un archivo lento escribe Cargando en el disco", async () => {
  // W10: the object file loads before the motion. After 300ms the disc
  // says so.
  const objeto = `data/2025/objeto/${CADENA}.json`;
  const sitio = montar("#/2025/88-1-0-1-1-1-1-1", { demorados: [objeto] });
  await sitio.navegador.listo();
  const paso = sitio.pulsar(fila(sitio, "Nivel 9"));
  await new Promise((seguir) => setTimeout(seguir, 320));
  assert.equal(sitio.parte("disco-numero").textContent, "Cargando…");
  sitio.soltar(objeto);
  await paso;
  assert.equal(sitio.titulo(), "Nivel 9");
  assert.notEqual(sitio.parte("disco-numero").textContent, "Cargando…");
});
```

- [ ] **Step 2: Run the tests and see them fail**

Run: `node --test test/pantalla.test.mjs`
Expected: FAIL with `SyntaxError: The requested module '../site/app/pantalla.js' does not provide an export named 'moverNavegador'`.

Run: `node --test test/app.test.mjs`
Expected: FAIL, 24 tests, 2 failures: the ring is not growing, and the disc does not say "Cargando…".

- [ ] **Step 3: Write the motion of the frame in pantalla.js**

In `site/app/pantalla.js`, replace this text:

```javascript
import { colorDe, escenaDe, svgDeEscena } from "./anillos.js";
```

with:

```javascript
import {
  colorDe, desdeCero, escenaDe, interpolar, RADIO_DEL_DISCO, svgDeEscena, tamanioDelDisco,
} from "./anillos.js";
```

In `site/app/pantalla.js`, replace this text:

```javascript
import {
  conSigno, fechaCorta, montoCorto, montoLargo, partesDelMonto, porcentaje,
} from "./formato.js";
```

with:

```javascript
import {
  conSigno, fechaCorta, montoCorto, montoLargo, partesDelMonto, pesosDe, porcentaje,
} from "./formato.js";
import { cifrasDe, htmlDelOdometro, ruedasDelOdometro } from "./movimiento.js";
```

In `site/app/pantalla.js`, replace this text:

```javascript
function pintarPie(documento,
```

with:

```javascript
function pintarCifras(documento, pesos, cifras) {
  parte(documento, "total").innerHTML = htmlDelOdometro(ruedasDelOdometro(pesos, cifras));
}

function pintarPie(documento,
```

In `site/app/pantalla.js`, replace this text:

```javascript
    parte(documento, "total").textContent = montoLargo(cuenta.total);
```

with:

```javascript
    const pesos = pesosDe(cuenta.total);
    pintarCifras(documento, pesos, cifrasDe(pesos));
```

Append to the end of `site/app/pantalla.js`:

```javascript
// ---- The motion of the frame ----------------------------------------------
//
// A painter draws the end state first. The motion then starts from the state
// before, and its last frame draws the end state again, with every
// destination. A tap during the motion ends it at once (R4).

export const ESPERA_DE_CARGA = 300;

export function pintarCargando(documento) {
  // W10: the data loads before the motion. A slow file says so in the disc.
  parte(documento, "disco-numero").textContent = "Cargando…";
  parte(documento, "disco-unidad").textContent = "";
}

export function ajustarDisco(documento) {
  // R7: measure the text at 100px, then give it the size that fits the hole.
  // The fake document of the tests has no layout, so it skips this.
  const monto = parte(documento, "disco");
  const lienzo = parte(documento, "lienzo");
  if (!monto.style || !lienzo.offsetWidth) {
    return;
  }
  monto.style.setProperty("--fs", "100px");
  const tamanio = tamanioDelDisco({
    ancho: monto.offsetWidth,
    alto: monto.offsetHeight,
    radio: (RADIO_DEL_DISCO * lienzo.offsetWidth) / 2,
  });
  if (tamanio !== null) {
    monto.style.setProperty("--fs", `${tamanio.toFixed(2)}px`);
  }
}

export function deslizar(documento, haciaElPasado) {
  // R11: an older year slides in from the left, a newer one from the right.
  // An empty value and a read of offsetWidth restart the CSS animation.
  const paneles = parte(documento, "app");
  paneles.setAttribute("data-desliza", "");
  void paneles.offsetWidth;
  paneles.setAttribute("data-desliza", haciaElPasado ? "izquierda" : "derecha");
}

export function moverNavegador(documento, vista, { motor, antes = null, direccion, reducido = false }) {
  if (direccion === "igual") {
    return;
  }
  if (direccion === "anio") {
    deslizar(documento, antes !== null && vista.ejercicio < antes.ejercicio);
  }
  // W4: with no scene before (the first load, P4, P2b or a failure), the
  // main ring grows once from 12 o'clock. A change of year slides the whole
  // screen, so the rings do not move on their own.
  let trazo = null;
  if (direccion !== "anio") {
    trazo = interpolar(antes?.escena ? antes.escena : desdeCero(vista.escena), vista.escena);
  }
  const pesosHasta = pesosDe(vista.total);
  const pesosDesde = antes?.total === undefined ? 0 : pesosDe(antes.total);
  const cifras = cifrasDe(Math.max(pesosDesde, pesosHasta));
  const anillos = parte(documento, "anillos");
  const grafico = parte(documento, "grafico");

  function paso(t) {
    if (reducido) {
      // A crossfade of the chart, and no ring moves.
      grafico.setAttribute("style", `opacity:${t}`);
      return;
    }
    if (trazo) {
      anillos.innerHTML = svgDeEscena(trazo(t));
    }
    // R5: the total rolls like an odometer.
    pintarCifras(documento, pesosDesde + (pesosHasta - pesosDesde) * t, cifras);
  }

  // Draw the first frame now, so the end state never flashes before it.
  paso(0);
  motor.animar({
    reducido,
    paso,
    fin: () => {
      grafico.setAttribute("style", "");
      anillos.innerHTML = svgDeEscena(vista.escena);
      pintarCifras(documento, pesosHasta, cifrasDe(pesosHasta));
      ajustarDisco(documento);
    },
  });
}
```

- [ ] **Step 4: Run the motion from app.js**

In `site/app/app.js`, replace this text:

```javascript
import { montoLargo } from "./formato.js";
import {
  esAusencia, expandirMiga, indiceParaClave, pilaDe, pintarAusente, pintarError,
  pintarFuentes, pintarNavegador, resolverPantalla, rutaDePila, vistaDeAusente,
  vistaDeError, vistaDeFuentes, vistaDeNavegador,
} from "./pantalla.js";
import {
  ancestroQueExiste, ejercicioDeEntrada, ejerciciosDisponibles, entradaDe,
  escrituraDe, rutaDeEntrada,
} from "./ruta.js";
```

with:

```javascript
import { montoLargo } from "./formato.js";
import { crearMotor } from "./movimiento.js";
import {
  ajustarDisco, deslizar, esAusencia, ESPERA_DE_CARGA, expandirMiga, indiceParaClave,
  moverNavegador, pilaDe, pintarAusente, pintarCargando, pintarError, pintarFuentes,
  pintarNavegador, resolverPantalla, rutaDePila, vistaDeAusente, vistaDeError,
  vistaDeFuentes, vistaDeNavegador,
} from "./pantalla.js";
import {
  ancestroQueExiste, direccionEntre, ejercicioDeEntrada, ejerciciosDisponibles,
  entradaDe, escrituraDe, rutaDeEntrada,
} from "./ruta.js";
```

In `site/app/app.js`, replace this text:

```javascript
  let tema = leerTema(almacen, prefiere);
  aplicarTema(documento, tema);
```

with:

```javascript
  let tema = leerTema(almacen, prefiere);
  aplicarTema(documento, tema);
  const reducido = () => prefiere("(prefers-reduced-motion: reduce)");
  // With no requestAnimationFrame (a test), a motion draws its end at once.
  const motor = crearMotor({
    cuadro: ventana.requestAnimationFrame?.bind(ventana),
    ahora: () => ventana.performance?.now?.() ?? Date.now(),
  });
  // The KPI of UC-01: a mark when the ring first appears, read in a walk.
  let marcado = false;
```

In `site/app/app.js`, replace this text:

```javascript
      pintarAusente(documento, vista);
      anunciar(
```

with:

```javascript
      pintarAusente(documento, vista);
      if (direccionEntre(actual?.ruta ?? null, ruta) === "anio") {
        deslizar(documento, ejercicio < actual.ruta.anio);
      }
      anunciar(
```

In `site/app/app.js`, replace this text:

```javascript
    const vista = { ...vistaDeNavegador(estado, pila), nota };
    pintarNavegador(documento, vista);
```

with:

```javascript
    const vista = { ...vistaDeNavegador(estado, pila), nota };
    pintarNavegador(documento, vista);
    moverNavegador(documento, vista, {
      motor,
      antes: actual?.vista ?? null,
      direccion: direccionEntre(actual?.ruta ?? null, ruta),
      reducido: reducido(),
    });
    if (!marcado) {
      marcado = true;
      ventana.performance?.mark?.("enquelagastan-anillo");
    }
```

In `site/app/app.js`, replace this text:

```javascript
  function ir(pedido, modo) {
    generacion += 1;
    const mia = generacion;
    const vigente = () => mia === generacion;
    // A stale run must write nothing, whether it succeeds or fails.
    enCurso = correr(pedido, modo, vigente).catch((error) => {
      if (vigente()) {
        informar(error);
      }
    });
    return enCurso;
  }
```

with:

```javascript
  function ir(pedido, modo) {
    // A new step ends the running motion at once (R4).
    motor.terminar();
    generacion += 1;
    const mia = generacion;
    const vigente = () => mia === generacion;
    const espera = setTimeout(() => {
      if (vigente()) {
        pintarCargando(documento);
      }
    }, ESPERA_DE_CARGA);
    // A stale run must write nothing, whether it succeeds or fails.
    enCurso = correr(pedido, modo, vigente)
      .catch((error) => {
        if (vigente()) {
          informar(error);
        }
      })
      .finally(() => clearTimeout(espera));
    return enCurso;
  }
```

In `site/app/app.js`, replace this text:

```javascript
  documento.addEventListener("click", (evento) => { manejarClick(evento); });
```

with:

```javascript
  // A finger or a mouse on a moving ring ends the motion before the click,
  // so the click lands on an arc with its destination.
  documento.addEventListener("pointerdown", () => motor.terminar());
  documento.addEventListener("click", (evento) => { manejarClick(evento); });
```

In `site/app/app.js`, replace this text:

```javascript
  alCambiarLaEntrada();
  return
```

with:

```javascript
  if (ventana.ResizeObserver) {
    new ventana.ResizeObserver(() => ajustarDisco(documento))
      .observe(documento.getElementById("lienzo"));
  }

  alCambiarLaEntrada();
  return
```

- [ ] **Step 5: Run the tests and see them pass**

Run: `node --test test/pantalla.test.mjs`
Expected: PASS, 47 tests.

Run: `node --test test/app.test.mjs`
Expected: PASS, 24 tests. One test waits 320ms for the notice of W10.

Run: `node --test`
Expected: PASS, 163 tests, 0 failures.

- [ ] **Step 6: Commit**

```bash
git add site/app/pantalla.js site/app/app.js test/pantalla.test.mjs test/app.test.mjs
git commit -F - <<'EOF'
Move the rings, the total and the panes between two places

A tapped part grows into the whole, and the way up plays the same motion
in reverse. The first load grows the ring once, a year slides the panes,
and the total rolls. A slow file says "Cargando" in the disc.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```


---

### Task 12: The style of the frame, and the four palettes

This task rewrites `estilo.css`. It holds the four palettes as tokens on `:root`, and the two attributes of Task 5 pick them (R16). The values come from the prototype. It lays out the two panes (R1), the top bar and its three rows at 375px (R20), the rings with their hit areas (R3), "Volver" at 44x44px (R10), the tape, the crossfade of 200ms (R13), reduced motion and the focus ring (R21). The frame takes the height of the window, and only the list of the tape scrolls, so the page does not scroll on a desktop (G4).

A test reads the four blocks of tokens and checks every slice at 3:1 and every text at 4.5:1. The prototype passes: its lowest pair for a slice is `--c3` on `--panel` of the light palette, and its lowest text is `--tenue` on `--hover`. The inline script of `index.html` sets the two attributes before the first paint, so a stored dark look never flashes.

Before you touch the CSS, read the skills `better-layout`, `better-typography`, `better-ui` and `better-accessibility`. Keep every value of the Global Constraints.

**Files:**
- Modify: `site/estilo.css`, `site/index.html`
- Test: `test/estilo.test.mjs`

**Interfaces:**
- Consumes: `CLAVE_OSCURO`, `CLAVE_BILLETES` (Task 5); every class and id of Tasks 9 to 11.
- Produces: the tokens `--fondo`, `--panel`, `--texto`, `--tenue`, `--regla`, `--acento`, `--foco`, `--hover`, `--c0` to `--c6`, `--otros`, in four blocks: `:root`, `:root[data-tema="oscuro"]`, `:root[data-vista="billetes"]`, `:root[data-vista="billetes"][data-tema="oscuro"]`. Also `--sans`, `--mono`, `--ancho-titulo`, `--ancho-numero`, `--curva`, `--alto-de-cifra`.


- [ ] **Step 1: Write the failing test**

Create `test/estilo.test.mjs`:

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { CLAVE_BILLETES, CLAVE_OSCURO } from "../site/app/tema.js";

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), "utf8");

// Every block of tokens of estilo.css, by selector: { ":root": { fondo: "#F2F3EF" } }.
function bloques(css) {
  const salida = {};
  for (const [, selector, cuerpo] of css.matchAll(/(:root(?:\[[^\]]+\])*)\s*\{([^}]*)\}/g)) {
    const tokens = salida[selector] ?? {};
    for (const [, nombre, valor] of cuerpo.matchAll(/--([\w-]+):\s*(#[0-9A-Fa-f]{6})\s*;/g)) {
      tokens[nombre] = valor;
    }
    salida[selector] = tokens;
  }
  return salida;
}

// WCAG 2.x: the relative luminance of an sRGB colour, and the ratio of two.
function luminancia(hex) {
  const [r, g, b] = [1, 3, 5].map((inicio) => {
    const canal = Number.parseInt(hex.slice(inicio, inicio + 2), 16) / 255;
    return canal <= 0.03928 ? canal / 12.92 : ((canal + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(uno, otro) {
  const [claro, oscuro] = [luminancia(uno), luminancia(otro)].sort((a, b) => b - a);
  return (claro + 0.05) / (oscuro + 0.05);
}

const TEMA = ':root[data-tema="oscuro"]';
const VISTA = ':root[data-vista="billetes"]';
const AMBOS = ':root[data-vista="billetes"][data-tema="oscuro"]';

test("las cuatro paletas cumplen el contraste de cada par", () => {
  const css = bloques(leer("../site/estilo.css"));
  const paletas = {
    claro: { ...css[":root"] },
    oscuro: { ...css[":root"], ...css[TEMA] },
    "billetes claro": { ...css[":root"], ...css[VISTA] },
    "billetes oscuro": { ...css[":root"], ...css[TEMA], ...css[VISTA], ...css[AMBOS] },
  };
  const porciones = ["c0", "c1", "c2", "c3", "c4", "c5", "c6", "otros"];
  const fallas = [];
  for (const [nombre, paleta] of Object.entries(paletas)) {
    for (const suelo of ["fondo", "panel"]) {
      // R16: a slice, the swatch of a row and the focus ring hold 3:1.
      for (const token of [...porciones, "foco"]) {
        const razon = contraste(paleta[token], paleta[suelo]);
        if (!(razon >= 3)) {
          fallas.push(`${nombre}: --${token} on --${suelo} is ${razon.toFixed(2)}`);
        }
      }
    }
    for (const suelo of ["fondo", "panel", "hover"]) {
      // Every text holds 4.5:1, on a row under the pointer too.
      for (const token of ["texto", "tenue", "acento"]) {
        const razon = contraste(paleta[token], paleta[suelo]);
        if (!(razon >= 4.5)) {
          fallas.push(`${nombre}: --${token} on --${suelo} is ${razon.toFixed(2)}`);
        }
      }
    }
  }
  assert.deepEqual(fallas, []);
  assert.equal(Object.keys(paletas["billetes oscuro"]).length, 16, "every palette has 16 tokens");
});

test("el script de index.html lee las mismas claves que tema.js", () => {
  // The inline script applies the look before the first paint. A key that
  // differs from tema.js would flash the default look on every visit.
  const pagina = leer("../site/index.html");
  assert.ok(pagina.includes(`"${CLAVE_OSCURO}"`));
  assert.ok(pagina.includes(`"${CLAVE_BILLETES}"`));
  assert.match(pagina, /prefers-color-scheme: dark/);
});

test("la pagina no carga nada de otro servidor", () => {
  // KPI Dependencies: no script, style or font from another server.
  const pagina = leer("../site/index.html");
  const estilo = leer("../site/estilo.css");
  assert.doesNotMatch(pagina, /<(script|link)[^>]+(src|href)="(https?:)?\/\//);
  assert.doesNotMatch(estilo, /url\(\s*["']?(https?:)?\/\//);
  assert.doesNotMatch(estilo, /@import/);
});
```

- [ ] **Step 2: Run the test and see it fail**

Run: `node --test test/estilo.test.mjs`
Expected: FAIL, 3 tests, 2 failures: the palettes have no tokens, and `index.html` has no inline script.

- [ ] **Step 3: Write the style**

Replace the whole content of `site/estilo.css`.

```css
/* The style of the navigator.
   Every rule here answers one class or id that index.html or site/app/
   writes. The four palettes are tokens on :root, and two attributes on
   <html> pick them: data-tema ("claro", "oscuro") and data-vista ("simple",
   "billetes"). test/estilo.test.mjs reads the four blocks below and checks
   every contrast, so keep each block a plain list of tokens. */

:root {
  /* Light. */
  --fondo: #F2F3EF;
  --panel: #FBFBF8;
  --texto: #1C1F22;
  --tenue: #555B61;
  --regla: #D3D6CF;
  --acento: #4B3A8C;
  --foco: #4B3A8C;
  --hover: #E4E6E0;
  --c0: #1F4E79;
  --c1: #B23A48;
  --c2: #2E7D5B;
  --c3: #B7791F;
  --c4: #5B4B8A;
  --c5: #2F7A8C;
  --c6: #8A5A44;
  --otros: #7A7F85;
}

:root[data-tema="oscuro"] {
  --fondo: #0F1724;
  --panel: #172234;
  --texto: #E9EDF3;
  --tenue: #9AA7B9;
  --regla: #2A3950;
  --acento: #B29CEE;
  --foco: #FFFFFF;
  --hover: #213049;
  --c0: #6DB3EC;
  --c1: #F0A35E;
  --c2: #79CF8A;
  --c3: #E27C9C;
  --c4: #B29CEE;
  --c5: #5CCBC2;
  --c6: #E3CD68;
  --otros: #7D8898;
}

/* R14: the colours of the peso bills. */
:root[data-vista="billetes"] {
  --c0: #C8612B;
  --c1: #3F7F4F;
  --c2: #2F5FA8;
  --c3: #6E4E9E;
  --c4: #B5476C;
  --c5: #2E8BB0;
  --c6: #9A7A2A;
}

/* The bills made lighter for the dark ground. */
:root[data-vista="billetes"][data-tema="oscuro"] {
  --c0: #F08A4E;
  --c1: #6FBF7F;
  --c2: #7FA6E8;
  --c3: #B79AE6;
  --c4: #E48AAA;
  --c5: #5CC3E6;
  --c6: #D9B55A;
}

/* ---- Type and motion ----------------------------------------------------- */

:root {
  color-scheme: light;
  --sans: "IBM Plex Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --mono: "IBM Plex Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  --ancho-titulo: 100%;
  --ancho-numero: 100%;
  --curva: cubic-bezier(0.23, 1, 0.32, 1);
  --alto-de-cifra: 1.2em;
}

:root[data-tema="oscuro"] { color-scheme: dark; }

:root[data-vista="billetes"] {
  --sans: "Archivo", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --mono: "Archivo", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --ancho-titulo: 112%;
  --ancho-numero: 80%;
}

/* R13: a switch of the look is a crossfade of 200ms. */
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 200ms;
}

*, *::before, *::after { box-sizing: border-box; }

/* The attribute hidden wins over every display rule below. */
[hidden] { display: none !important; }

html, body { margin: 0; height: 100%; }

body {
  background: var(--fondo);
  color: var(--texto);
  font: 400 16px/1.45 var(--sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

button {
  font: inherit;
  color: inherit;
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;
}

a { color: var(--acento); text-underline-offset: 3px; }

/* R21: the ring is the only thing that tells a keyboard where it is. */
:focus-visible {
  outline: 3px solid var(--foco);
  outline-offset: 2px;
  border-radius: 4px;
}

h1:focus { outline: none; }

.solo-lectores {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

/* ---- The frame (R1, G4) ---------------------------------------------------- */

/* One screen on a desktop: the frame takes the height of the window, and
   only the list of the tape scrolls. */
.marco {
  height: 100dvh;
  display: grid;
  grid-template-rows: auto 1fr;
  overflow: hidden;
}

.paneles {
  display: grid;
  grid-template-columns: 55fr 45fr;
  min-height: 0;
}

/* ---- The top bar (R20, W2) --------------------------------------------------- */

.barra {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 24px;
  padding: 8px 24px;
  border-bottom: 1px solid var(--regla);
}

.sitio {
  flex: none;
  padding: 10px 6px;
  border-radius: 6px;
  font-weight: 600;
  color: var(--texto);
  text-decoration: none;
}

.miga ol {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.miga li { display: flex; align-items: center; gap: 6px; min-width: 0; }

.miga li + li::before { content: "›"; color: var(--tenue); }

/* WCAG 2.5.8: a target of 24px or more. */
.tramo {
  min-height: 24px;
  max-width: 28ch;
  padding: 4px 6px;
  border-radius: 6px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--tenue);
  text-decoration: underline;
  text-decoration-color: var(--regla);
  text-underline-offset: 3px;
}

.empuje { flex: 1; }

.anios { display: flex; align-items: center; gap: 4px; flex: none; }

.flecha {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  font-size: 22px;
}

.flecha:disabled { opacity: 0.35; cursor: default; }

.anio {
  min-width: 3.2em;
  text-align: center;
  font: 600 20px var(--mono);
  font-stretch: var(--ancho-numero);
  font-variant-numeric: tabular-nums;
}

.interruptores { display: flex; gap: 16px; flex: none; }

.interruptor {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 6px;
  border-radius: 8px;
}

.pista {
  position: relative;
  width: 34px;
  height: 20px;
  border-radius: 10px;
  background: var(--regla);
  transition: background-color 200ms;
}

.pista::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--panel);
  box-shadow: 0 1px 2px #0004;
  transition: transform 200ms var(--curva);
}

.interruptor[aria-checked="true"] .pista { background: var(--acento); }

.interruptor[aria-checked="true"] .pista::after { transform: translateX(14px); }

@media (hover: hover) and (pointer: fine) {
  .sitio:hover, .tramo:hover, .flecha:hover:not(:disabled), .interruptor:hover,
  .volver:hover, .fila[data-abrir]:hover {
    background: var(--hover);
  }
  .tramo:hover { color: var(--texto); }
}

/* ---- The chart pane (R2, R7, R10) ------------------------------------------- */

.panel-grafico {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 0;
  padding: 20px 32px 24px;
  overflow-y: auto;
}

.cabeza { display: flex; align-items: flex-start; gap: 8px; }

/* R10: 44 by 44 px or more. */
.volver {
  flex: none;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 44px;
  min-height: 44px;
  margin: -6px 0 0 -10px;
  padding: 0 12px 0 8px;
  border-radius: 8px;
  font-weight: 500;
}

.volver svg { width: 20px; height: 20px; }

h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  font-stretch: var(--ancho-titulo);
  line-height: 1.2;
  text-wrap: balance;
}

.frase {
  margin: 0;
  font-size: 20px;
  font-stretch: var(--ancho-titulo);
  line-height: 1.3;
  text-wrap: balance;
}

.frase b { font-stretch: var(--ancho-numero); font-variant-numeric: tabular-nums; }

/* R14: the sentence belongs to the view "Billetes". */
:root[data-vista="simple"] .frase { display: none; }

.subtitulo, .detalle, .nota p { margin: 0; color: var(--tenue); }

.nota p { max-width: 38rem; text-wrap: pretty; }

.acciones { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 20px; margin-top: 8px; }

.principal, .secundario {
  min-height: 44px;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 500;
}

.principal { background: var(--texto); color: var(--fondo); }

.secundario { text-decoration: underline; text-underline-offset: 3px; }

.caja {
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  place-items: center;
  container-type: size;
}

.lienzo { position: relative; width: min(100cqw, 100cqh); aspect-ratio: 1; }

#grafico { display: block; width: 100%; height: 100%; overflow: visible; }

/* The slices are separated by a line of the ground colour, so two
   neighbours never read as one. */
.arco {
  stroke: var(--fondo);
  stroke-width: 2px;
  vector-effect: non-scaling-stroke;
  cursor: pointer;
  transition: filter 150ms ease;
}

.arco.ciego { cursor: default; pointer-events: none; }

/* R3: a transparent stroke of 24px under every arc that navigates. */
.golpe {
  fill: none;
  stroke: transparent;
  stroke-width: 24px;
  pointer-events: stroke;
  cursor: pointer;
}

.contorno {
  fill: none;
  stroke: var(--regla);
  stroke-width: 2px;
  vector-effect: non-scaling-stroke;
}

@media (hover: hover) and (pointer: fine) {
  .arco[data-abrir]:hover, .arco[data-subir]:hover { filter: brightness(1.12); }
}

.disco {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  text-align: center;
  pointer-events: none;
}

/* app.js sets --fs from the radius of the hole (R7). */
.monto { --fs: 34px; display: flex; flex-direction: column; align-items: center; white-space: nowrap; }

.monto .numero {
  font: 600 var(--fs)/1 var(--mono);
  font-stretch: var(--ancho-numero);
  font-variant-numeric: tabular-nums;
}

.monto .unidad {
  margin-top: calc(var(--fs) * 0.12);
  font-size: calc(var(--fs) * 0.45);
  line-height: 1.2;
  color: var(--tenue);
}

/* ---- The tape pane (R5, INV-03) --------------------------------------------- */

.panel-cinta {
  display: grid;
  grid-template-rows: 1fr auto;
  min-height: 0;
  background: var(--panel);
  border-left: 1px solid var(--regla);
}

.renglones { min-height: 0; overflow-y: auto; }

.renglones ul { margin: 0; padding: 12px 0; list-style: none; }

.renglones li { border-bottom: 1px dashed var(--regla); }

.fila {
  width: 100%;
  min-height: 44px;
  display: grid;
  grid-template-columns: 14px 1fr auto;
  column-gap: 12px;
  padding: 10px 28px;
  text-align: left;
}

.muestra { width: 14px; height: 14px; margin-top: 4px; border-radius: 3px; grid-row: span 2; }

.fila .nombre { font-weight: 500; }

.fila .pct, .fila .corto {
  font-family: var(--mono);
  font-stretch: var(--ancho-numero);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.fila .pct { font-weight: 600; }

.fila .corto { grid-column: 2 / 4; color: var(--tenue); }

.vacio { margin: 0; padding: 16px 28px; color: var(--tenue); }

.imprime { animation: imprime 180ms var(--curva) both; }

@keyframes imprime {
  from { opacity: 0; transform: translateY(-6px); }
}

.fuentes { width: 100%; margin: 12px 0; border-collapse: collapse; }

.fuentes td { padding: 10px 28px 10px 0; border-bottom: 1px solid var(--regla); vertical-align: top; }

.fuentes td:first-child {
  padding-left: 28px;
  font: 600 16px var(--mono);
  font-variant-numeric: tabular-nums;
}

.fuentes a { overflow-wrap: anywhere; }

.pie { padding: 12px 28px 16px; border-top: 4px double var(--texto); }

.cuenta p { margin: 0; }

.rotulo { color: var(--tenue); }

.total {
  display: flex;
  justify-content: flex-end;
  align-items: baseline;
  gap: 0.5em;
  font: 600 30px/1.2 var(--mono);
  font-stretch: var(--ancho-numero);
  font-variant-numeric: tabular-nums;
}

.total .unidad { font-size: 16px; font-weight: 400; }

.cifras { display: inline-flex; height: var(--alto-de-cifra); overflow: hidden; white-space: nowrap; }

.rueda { display: inline-block; height: var(--alto-de-cifra); overflow: hidden; }

.tira { display: flex; flex-direction: column; }

.tira span { height: var(--alto-de-cifra); line-height: var(--alto-de-cifra); }

.fuente, .codigos, .enlaces { margin: 8px 0 0; color: var(--tenue); overflow-wrap: anywhere; }

.codigos { font: 13px/1.5 var(--mono); }

.enlaces { display: flex; flex-wrap: wrap; gap: 4px 20px; }

.enlaces a { display: inline-flex; align-items: center; min-height: 24px; }

/* ---- The slide of a year (R11) ---------------------------------------------- */

.paneles[data-desliza="izquierda"] { animation: desde-la-izquierda 420ms var(--curva) both; }

.paneles[data-desliza="derecha"] { animation: desde-la-derecha 420ms var(--curva) both; }

@keyframes desde-la-izquierda {
  from { opacity: 0; transform: translateX(-48px); }
}

@keyframes desde-la-derecha {
  from { opacity: 0; transform: translateX(48px); }
}

/* R21: reduced motion. The rows appear at once, and a year fades in 150ms. */
@media (prefers-reduced-motion: reduce) {
  .imprime { animation: none; }
  .paneles[data-desliza="izquierda"], .paneles[data-desliza="derecha"] {
    animation: fundido 150ms linear both;
  }
  .pista, .pista::after, .arco { transition: none; }
}

@keyframes fundido {
  from { opacity: 0; }
}

/* ---- A telephone (R1, R20) ---------------------------------------------------- */

@media (max-width: 800px) {
  /* The page scrolls here, and the chart comes first. */
  .marco { height: auto; min-height: 100dvh; overflow: visible; }

  /* Three rows: the name and the breadcrumb, the years, the switches. */
  .barra { gap: 4px 12px; padding: 8px 16px; }
  .empuje { flex-basis: 100%; height: 0; }
  .anios { flex-basis: 100%; }

  .paneles { display: block; }
  .panel-grafico { padding: 16px; overflow: visible; }
  h1 { font-size: 22px; }
  .caja { flex: none; height: min(92vw, 420px); }
  .panel-cinta { border-left: 0; border-top: 1px solid var(--regla); }
  .renglones { overflow: visible; }
  .fila, .vacio { padding: 10px 16px; }
  .pie { padding: 12px 16px 24px; }
  .total { font-size: 22px; }
}
```

- [ ] **Step 4: Set the look before the first paint**

In `site/index.html`, replace this text:

```html
    <link rel="stylesheet" href="estilo.css" />
```

with:

```html
    <script>
      // Apply the stored look before the first paint, so a look never
      // flashes. site/app/tema.js holds the same keys, and a test checks it.
      (() => {
        const leer = (clave) => {
          try { return localStorage.getItem(clave); } catch { return null; }
        };
        const raiz = document.documentElement;
        const oscuro = leer("enquelagastan-oscuro");
        const esOscuro = oscuro === null
          ? matchMedia("(prefers-color-scheme: dark)").matches
          : oscuro === "true";
        raiz.setAttribute("data-tema", esOscuro ? "oscuro" : "claro");
        raiz.setAttribute("data-vista", leer("enquelagastan-billetes") === "true" ? "billetes" : "simple");
      })();
    </script>
    <link rel="stylesheet" href="estilo.css" />
```

- [ ] **Step 5: Run the tests and see them pass**

Run: `node --test test/estilo.test.mjs`
Expected: PASS, 3 tests.

Run: `node --test`
Expected: PASS, 166 tests, 0 failures.

- [ ] **Step 6: Look at the frame in a browser**

The data must exist under `site/data/`. If it does not, run the build first: `python -m build --destino site/data`.

```bash
python3 -m http.server 8000 --directory site
```

Open `http://localhost:8000/#/2025` at 1440x900. Confirm that the page does not scroll: in the console, `document.documentElement.scrollHeight <= innerHeight` gives `true`. Repeat at 1280x720. At 375x812, confirm the three rows of the top bar and the chart above the tape. The full walk is at the end of this plan.

- [ ] **Step 7: Commit**

```bash
git add site/estilo.css site/index.html test/estilo.test.mjs
git commit -F - <<'EOF'
Style the frame with four palettes that pass a contrast test

The chart takes 55% of the width and the tape 45%, and only the list
scrolls. Two attributes on the html element pick one of four palettes. A
test checks every slice at 3:1 and every text at 4.5:1.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```


---

### Task 13: The typefaces

R17 uses IBM Plex Sans for the interface, IBM Plex Mono for the amounts, and Archivo for "Billetes". The site hosts the `woff2` files under `site/fuentes/`, with a Latin subset, under the SIL Open Font License. RQ3 sets a target of under 300 KB for the three families. A test measures the files, so the answer to RQ3 is a number, not an estimate.

**The files come from another server. Downloading a file needs the permission of the user, with the name, the source and the size of every file.** The sizes need a lookup first (D9). So this task has two gates. Do not download anything before the answer of the user.

**Files:**
- Create: `site/fuentes/ibm-plex-sans-400.woff2`, `site/fuentes/ibm-plex-sans-500.woff2`, `site/fuentes/ibm-plex-sans-600.woff2`, `site/fuentes/ibm-plex-mono-400.woff2`, `site/fuentes/ibm-plex-mono-500.woff2`, `site/fuentes/ibm-plex-mono-600.woff2`, `site/fuentes/archivo.woff2`, `site/fuentes/ibm-plex-sans-ofl.txt`, `site/fuentes/ibm-plex-mono-ofl.txt`, `site/fuentes/archivo-ofl.txt`
- Modify: `site/estilo.css`, `docs/superpowers/specs/2026-09-17-navigator-redesign-design.md` (the row of RQ3)
- Test: `test/estilo.test.mjs`

**Interfaces:**
- Consumes: `--sans` and `--mono` of Task 12, which already name the three families with system fallbacks.
- Produces: seven `@font-face` rules, each with `font-display: swap`.


- [ ] **Step 1: STOP: ask the user for permission to look up the files**

Send the user this message, and wait for a clear yes:

> The typefaces of R17 come from Google Fonts. To give you the name, the source and the size of each file, I need to read three small CSS files of the Google Fonts CSS API (about 1 to 3 KB each), and send HEAD requests to the font files and the licences. A HEAD request downloads no file. The three CSS files:
> - `https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&display=swap`
> - `https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap`
> - `https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..700&display=swap`
>
> May I read them?

If the answer is not a yes, stop the task and report it.

- [ ] **Step 2: Look up the files and their sizes**

The CSS API serves `woff2` only to a browser, so send the User-Agent of one. Keep the URL of the `/* latin */` block of each weight.

```bash
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
for familia in "IBM+Plex+Sans:wght@400;500;600" "IBM+Plex+Mono:wght@400;500;600" "Archivo:wdth,wght@62..125,400..700"; do
  curl -s -A "$UA" "https://fonts.googleapis.com/css2?family=${familia}&display=swap"
done > /tmp/fuentes.css
# Print each latin block: the weight and the URL of the file.
awk '/\/\* latin \*\//{b=1} b&&/font-weight/{p=$0} b&&/src:/{print p, $0; b=0}' /tmp/fuentes.css
```

For every URL, read the size with a HEAD request:

```bash
curl -sIL "<url>" | grep -i '^content-length'
```

The licences:

- `https://raw.githubusercontent.com/google/fonts/main/ofl/ibmplexsans/OFL.txt`
- `https://raw.githubusercontent.com/google/fonts/main/ofl/ibmplexmono/OFL.txt`
- `https://raw.githubusercontent.com/google/fonts/main/ofl/archivo/OFL.txt`

Read their sizes the same way. When the CSS gives one URL for two or three weights, the family is variable: it is one file.

- [ ] **Step 3: STOP: ask the user for permission to download**

Send the user a table with one row per file: the name under `site/fuentes/`, the source URL, and the size in KB. Add the total of the `woff2` files, and say whether it is under 300 KB. Wait for a clear yes.

Use these names. A variable family whose weights share one URL gets one file with no weight in its name, as `ibm-plex-sans.woff2`.

| Name | Source |
|---|---|
| `ibm-plex-sans-400.woff2`, `-500`, `-600` | the latin block of IBM Plex Sans, weights 400, 500, 600 |
| `ibm-plex-mono-400.woff2`, `-500`, `-600` | the latin block of IBM Plex Mono, weights 400, 500, 600 |
| `archivo.woff2` | the latin block of Archivo |
| `ibm-plex-sans-ofl.txt`, `ibm-plex-mono-ofl.txt`, `archivo-ofl.txt` | the three `OFL.txt` above |

If the total is 300 KB or more, say so, and offer the mitigations of the spec: one family fewer, or fewer weights. Let the user decide. If the answer is not a yes, stop the task and report it.

- [ ] **Step 4: Download the files**

```bash
mkdir -p site/fuentes
curl -sL -o site/fuentes/<name> "<source url>"
```

Run one `curl` per row of the approved table. Then confirm that each `woff2` file starts with the signature `wOF2`:

```bash
for f in site/fuentes/*.woff2; do printf '%s ' "$f"; head -c 4 "$f"; echo; done
```

- [ ] **Step 5: Write the failing test**

In `test/estilo.test.mjs`, replace this text:

```javascript
import { readFileSync } from "node:fs";
```

with:

```javascript
import { readFileSync, statSync } from "node:fs";
```

Append to the end of `test/estilo.test.mjs`:

```javascript
test("las tipografias viven en el sitio, cambian con swap y pesan menos de 300 KB", () => {
  // R17 and RQ3. A font file that does not load shows a system font.
  const caras = [...leer("../site/estilo.css").matchAll(/@font-face\s*\{([^}]*)\}/g)]
    .map(([, cuerpo]) => cuerpo);
  const familias = new Set(caras.map((cara) => /font-family: "([^"]+)";/.exec(cara)?.[1]));
  assert.deepEqual([...familias].sort(), ["Archivo", "IBM Plex Mono", "IBM Plex Sans"]);
  let bytes = 0;
  const leidos = new Set();
  for (const cara of caras) {
    assert.match(cara, /font-display: swap;/);
    const ruta = /url\("(fuentes\/[\w-]+\.woff2)"\)/.exec(cara)?.[1];
    assert.ok(ruta, cara);
    // A variable file can serve two faces. It weighs once.
    if (!leidos.has(ruta)) {
      leidos.add(ruta);
      bytes += statSync(new URL(`../site/${ruta}`, import.meta.url)).size;
    }
  }
  assert.ok(bytes < 300_000, `RQ3: the three families weigh ${bytes} bytes`);
  for (const licencia of ["ibm-plex-sans-ofl.txt", "ibm-plex-mono-ofl.txt", "archivo-ofl.txt"]) {
    assert.match(leer(`../site/fuentes/${licencia}`), /SIL OPEN FONT LICENSE/i);
  }
});
```

Run: `node --test test/estilo.test.mjs`
Expected: FAIL, 4 tests, 1 failure: the families list is empty, because `estilo.css` has no `@font-face` yet.

- [ ] **Step 6: Declare the typefaces**

In `site/estilo.css`, replace this text: Put the rules before the section of type and motion.

```css
/* ---- Type and motion
```

with:

```css
/* ---- The typefaces (R17) --------------------------------------------------
   The site hosts the Latin subset of each family, under the SIL Open Font
   License. font-display: swap shows a system font until a file arrives. */

@font-face {
  font-family: "IBM Plex Sans";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("fuentes/ibm-plex-sans-400.woff2") format("woff2");
}

@font-face {
  font-family: "IBM Plex Sans";
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url("fuentes/ibm-plex-sans-500.woff2") format("woff2");
}

@font-face {
  font-family: "IBM Plex Sans";
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url("fuentes/ibm-plex-sans-600.woff2") format("woff2");
}

@font-face {
  font-family: "IBM Plex Mono";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("fuentes/ibm-plex-mono-400.woff2") format("woff2");
}

@font-face {
  font-family: "IBM Plex Mono";
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url("fuentes/ibm-plex-mono-500.woff2") format("woff2");
}

@font-face {
  font-family: "IBM Plex Mono";
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url("fuentes/ibm-plex-mono-600.woff2") format("woff2");
}

/* One variable file holds every width and weight of Archivo. */
@font-face {
  font-family: "Archivo";
  font-style: normal;
  font-weight: 400 700;
  font-stretch: 62% 125%;
  font-display: swap;
  src: url("fuentes/archivo.woff2") format("woff2");
}

/* ---- Type and motion
```

If a family is variable (Step 2), point its three rules to the one file, as `url("fuentes/ibm-plex-sans.woff2")`. Keep the three rules: each one names its weight.

- [ ] **Step 7: Run the tests and see them pass**

Run: `node --test test/estilo.test.mjs`
Expected: PASS, 4 tests. The message of the size test names the total in bytes when it fails.

Run: `node --test`
Expected: PASS, 167 tests, 0 failures.

- [ ] **Step 8: Record RQ3 in the spec**

Measure the total:

```bash
du -cb site/fuentes/*.woff2 | tail -1
```

In `docs/superpowers/specs/2026-09-17-navigator-redesign-design.md`, replace the row of RQ3 in "Open questions":

```markdown
| RQ3 | How many kilobytes do the font files cost? Target: under 300 KB for the three families | deferred | the agent | writing-plans |
```

with this row, and put the measured number in it:

```markdown
| RQ3 | How many kilobytes do the font files cost? Target: under 300 KB for the three families | closed: <n> KB for the three families, measured on <date> by Task 13 of the plan | the agent | done |
```

Then open `http://localhost:8000/#/2025`. In the Network panel, confirm that every font comes from `localhost`. Switch "Billetes" on, and confirm that the title uses Archivo.

- [ ] **Step 9: Commit**

```bash
git add site/fuentes site/estilo.css test/estilo.test.mjs docs/superpowers/specs/2026-09-17-navigator-redesign-design.md
git commit -F - <<'EOF'
Host the three typefaces on the site

IBM Plex Sans, IBM Plex Mono and Archivo live under site/fuentes, with a
Latin subset and their licences. A test checks that every face swaps and
that the families weigh under 300 KB. RQ3 is closed.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```


---

### Task 14: The documents

`README.md` describes a pie chart and a strip of years. The Purpose of `CLAUDE.md` describes a pie chart. The base spec already points its decisions C3, C5 and UC-05 to the spec of the redesign, so this task does not edit the base spec.

**Files:**
- Modify: `README.md`, `CLAUDE.md`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing that code reads.


- [ ] **Step 1: Update the README**

In `README.md`, replace this text:

```markdown
The screens read those files. The first screen shows the total of the
exercise as a pie chart. One slice is one jurisdiccion. The reader taps a
slice and goes one level down: entidad, programa, actividad, and the object
of the spending. The reader taps a year and sees the same level in that
year.

The foot of every screen names the file and the date the number comes from.
That line is always visible.

The site needs no login and no knowledge of budget terms. It loads no font
and no script from another server.

The design of the screens lives in
`docs/designpowers/2026-09-14-public-spending-navigator/02-wireframes.md`.
```

with:

```markdown
The screens read those files. The first screen shows the total of the
exercise as a chart of rings, with a tape of rows beside it. One part of the
main ring is one jurisdiccion. The reader taps a part, or its row, and the
part grows into the whole: entidad, programa, actividad, and the object of
the spending. The outer rings keep the path in sight.

"Volver", the key Escape, the breadcrumb and the Back button of the browser
go up. The arrows of the top bar change the year, and the path stays. Every
step is an entry of the history, so a link opens the same nodo.

Two switches change the look. "Oscuro" gives a dark look. "Billetes" gives
the colours of the peso bills, and one sentence: how many pesos of every 100
went to the largest part.

The foot of the tape names the file and the date the number comes from.
That foot is always visible.

The site needs no login and no knowledge of budget terms. It loads no font
and no script from another server. The typefaces live under `site/fuentes/`.

The design of the screens lives in
`docs/superpowers/specs/2026-09-17-navigator-redesign-design.md` and
`docs/designpowers/2026-09-17-navigator-redesign/02-wireframes.md`.
```

Keep the line "The site is live at …" as it is. The spec says that GitHub Pages fails while the repository is private (D8). Name that contradiction in the report of the task, and let the user decide.

- [ ] **Step 2: STOP: ask the user before you edit CLAUDE.md**

`CLAUDE.md` holds the rules of the repository. An agent does not change it on its own. Show the user the change below, and wait for a clear yes. If the answer is not a yes, skip Step 3 and say so in the report.

- [ ] **Step 3: Update the Purpose of CLAUDE.md**

In `CLAUDE.md`, replace this text:

```markdown
This project shows that data as one map. The user sees the total spending as a
pie chart, with the fiscal result beside it. The user taps one slice and goes
one level down: jurisdiction, entity, program, activity, object of the
spending.
```

with:

```markdown
This project shows that data as one map. The user sees the total spending as a
chart of concentric rings, with the fiscal result beside it. The user taps one
part and goes one level down: jurisdiction, entity, program, activity, object
of the spending.
```

- [ ] **Step 4: Check the words**

Run: `grep -n "pie chart\|slice" README.md CLAUDE.md`
Expected: no output.

Run: `node --test`
Expected: PASS, 167 tests, 0 failures.

Run: `python -m unittest discover -s tests`
Expected: OK, 78 tests (skipped=1).

- [ ] **Step 5: Commit**

```bash
git add README.md CLAUDE.md
git commit -F - <<'EOF'
Describe the chart of rings in the README and in CLAUDE.md

The README describes the rings, the tape, the history and the two
switches. The Purpose of CLAUDE.md names the chart of rings.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```


---

## Spec coverage

| Item | What it asks | Task |
|---|---|---|
| R1 | Two panes, 55% and 45%; stacked on a telephone, chart first | 10 (frame), 12 (layout) |
| R2 | Disc, main ring, thin ring with the nodo lit, hairline ring with the ancestor lit; a lit arc goes to its level | 1 (scene), 9 (SVG in the frame), 10 (`data-subir`) |
| R3 | A hit area of 24px or more on every arc that navigates | 1 (`golpe` path), 12 (`stroke-width: 24px`) |
| R4 | Down and up motion, 450 to 550ms, the cubic Bézier, a tap ends it, 150ms crossfade with reduced motion | 1 (`interpolar`), 6 (runner, easing), 11 (on screen, `pointerdown`) |
| R5 | Rows print in 30ms apart, "otros" shows its count, the total rolls, the list scrolls | 6 (odometer), 9 (delay, "Otros (n)"), 11 (roll), 12 (scroll) |
| R6 | No stamp on any screen | 9 (no painter writes one) |
| R7 | Two lines in the disc, size follows the inner radius with a 12% margin | 4 (`partesDelMonto`, `tamanioDelDisco`), 9 (two spans), 11 (`ajustarDisco`) |
| R8 | The measure named twice only: subtitle of the root and foot | 8 (`subtitulo`), 9 (`fuente`) |
| R9 | `Inicio › <level 1> › … › <previous>`, never the current nodo, "…" opens, accents and case | 2 (`migaCorta`), 9 (`pintarBarra`, `expandirMiga`) |
| R10 | "Volver" left of the title on P2 and in a group, 44x44px, Escape | 9, 10 (`volver`, K1), 12 (size) |
| R11 | `‹ 2025 ›` in the top bar, accessible names, disabled at the ends, arrow keys, slide by direction, path stays | 8 (`aniosVecinos`), 10 (index.html, `cambiarAnio`, K2), 11 (`deslizar`), 12 (keyframes) |
| R12 | Every step an entry; root and nodo hashes; group claves in state; year is an entry; popstate draws; a skip replaces | 7 (model), 10 (`app.js`) |
| R13 | "Oscuro", first value from `prefers-color-scheme`, stored, 200ms crossfade | 5, 10 (`conmutar`), 12 (view transition, inline script) |
| R14 | "Billetes": bill colours, Archivo, the sentence; works with "Oscuro" | 5, 12 (palettes), 13 (Archivo) |
| R15 | The sentence, "en forma directa", no part, centavos, under 1 centavo | 3, 8 (`frase`), 9 (bold amount) |
| R16 | Four palettes, "otros" neutral, slices 3:1, texts 4.5:1, a test | 1 (`colorDe`), 12 (tokens, `estilo.test.mjs`) |
| R17 | Plex Sans, Plex Mono, Archivo, hosted `woff2`, Latin subset, OFL | 13 |
| R18 | The line of the execution and the deviation; only the part of the total in a group | 8 (`lineaDeDetalle`) |
| R19 | The new look on P1, P2 (institutional and object levels), P2b, P4, failure | 9, 10 (the object file is joined as before), 12 |
| R20 | The name of the site starts the top bar and goes to the root; three rows at 375px | 10 (`#sitio`), 12 |
| R21 | Focus ring, every part reachable as a row, one live region, reduced motion | 9 (rows are buttons, focus to the title), 10 (`#aviso`), 11 (reduced path), 12 (`:focus-visible`) |
| W1 | No new place | 9 (five painters) |
| W2 | One top bar on every place | 9 (`pintarBarra` on every place), 10 |
| W3 | The link to P4 and the codes at the last level stay | 9 (`codigos`, `fuentes-enlace`), 10 (test of the link) |
| W4 | The main ring grows once on the first load; no other motion without a tap | 1 (`desdeCero`), 11 |
| W5 | A change of year closes an open group and keeps its nodo | 10 (`cambiarAnio`, test) |
| W6 | Every step pushes one entry, "Volver" too | 7, 10 (test) |
| W7 | Only a lit arc navigates | 1 (`subir` only when lit) |
| W8 | A group is not in the URL | 7, 10 (test) |
| W9 | A switch adds no entry | 10 (test) |
| W10 | Data loads before the motion; "Cargando…" after 300ms | 11 |
| W11 | No swipe | not built, by decision |
| W12 | P2b has no "Volver" | 9, 10 (tests) |
| W13 | P4: method in the chart pane, table in the tape pane | 9 |
| W14 | Colours restart at every level by size; the lit arc keeps its colour | 1 |
| W15 | "en forma directa" stays | 3 |
| G1 | Every number reads with no effort | 4, 9, 12, 13 |
| G2 | A tap feels like a step into the data | 1, 11 |
| G3 | The visitor always knows the place | 1, 2, 8, 9 |
| G4 | No page scroll at 1440x900 and 1280x720 | 12, and the walk below |
| G5 | Going back is obvious | 7, 10, and the walk below |
| G6 | A dark look and the view "Billetes" | 5, 10, 12, 13 |
| KPI: page scroll on a desktop | none at 1440x900 and 1280x720 | 12, walk step 2 |
| KPI: contrast | text 4.5:1, slices 3:1, four palettes | 12 (`estilo.test.mjs`) |
| KPI: duration of a step | 450 to 550ms | 6 (`DURACION = 500`, a test), walk step 5 |
| KPI: Back moves inside the navigator | every step of the walk | 10 (tests), walk step 4 |
| KPI: chart visible after the first load | a performance mark | 11 (`enquelagastan-anillo`), walk step 1 |
| KPI: errors in the console | 0 | walk step 7 |
| KPI: dependencies | 0 | 12 (`estilo.test.mjs`), 13 |
| KPI: completion rates | no measurement point, by scope | not built |

## Verification walk

Run this walk after Task 14, in a real browser. Serve the site with `python3 -m http.server 8000 --directory site`. Record what you see for every step in the report.

1. **First load.** Open `http://localhost:8000/` at 1440x900. The title says "Cargando el gasto público…", then the main ring grows once and the rows print in. In the console, `performance.getEntriesByName("enquelagastan-anillo")[0].startTime` gives a number. Write it down.
2. **No page scroll.** At 1440x900 and at 1280x720, on the root and on the deepest nodo you reach, `document.documentElement.scrollHeight <= innerHeight` gives `true`. Only the list of the tape scrolls.
3. **Telephone.** At 375x812, the top bar has three rows: the name and the breadcrumb, the years, the switches. The chart comes before the tape. Every arc of the thin and hairline rings responds to a tap.
4. **Back and Forward.** From the root: tap "Ministerio de Capital Humano", tap its largest part, tap "Otros" of that level if it exists, tap "Volver", press Escape, press ArrowLeft, tap the name of the site. Then press Back of the browser once per step, and Forward once per step. Every Back and every Forward lands on the place you saw, with the group "otros" too, and never leaves the site. The title, the breadcrumb and the lit arcs match each place.
5. **Motion.** A step down and a step up each last about half a second, and the tapped part grows into the whole. Tap a row during a motion: the motion ends at once and the next one starts. In DevTools, emulate `prefers-reduced-motion: reduce`: a step fades in about 150ms, the rows appear at once, and a year fades.
6. **Four palettes.** Switch "Oscuro" and "Billetes" through the four combinations on P1, P2, P2b (a clave of 2025 that 2026 lacks, then ArrowRight), P4 ("De dónde salen estos números") and the failure screen (stop the server, then tap a part that needs an object file). The place never changes, a switch adds no entry to Back, and a reload keeps the look with no flash. Keyboard focus shows a visible ring in every palette.
7. **Console.** Through steps 1 to 6 the console shows 0 errors and 0 warnings of the page. The Network panel shows no request to another server.
8. **The last level.** Go down to an object of the spending. The chart shows one full ring, the tape shows one row that is not a button, and the foot shows the codes `jurisdiccion_id=…`.

## What this plan leaves for the next one

| Item | Why it waits |
|---|---|
| P3, the fiscal result | It needs the revenue of the exercise, and the build produces none. |
| The button that removes the inflation | Deferred by the user. |
| Two fast presses of a year arrow | The generation counter lets the last press win, but both presses start from the year on screen. A second press before the file arrives asks for the same year again. |
| The motion on a slow telephone | About 20 arcs change on every frame. If a walk on a real telephone shows dropped frames, shorten `DURACION` or use the reduced path. Not measured. |

## Open questions that this plan answers

| # | Question | Answer |
|---|---|---|
| RQ3 | How many kilobytes do the font files cost? | Task 13 measures the files with a test, and it records the number in the spec. |

## Open questions that stay open

Q1 to Q4, Q8 to Q11 of the base spec. None of them blocks this plan.
