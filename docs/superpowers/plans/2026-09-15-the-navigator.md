# The navigator: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the screens that read the JSON files of the build, so a visitor opens one page, sees the whole spending of the Argentine national state as a pie chart, and goes down with a tap to the object of the spending.

**Architecture:** One static page with no framework and no step of build. The browser loads the institutional file of one exercise once, and every movement inside that axis then touches no network. ES modules split the logic into focused files that the browser loads directly. The pie chart is inline SVG that this project draws.

**Tech Stack:** HTML, CSS and JavaScript of the browser. ES modules, no bundler. `node --test` for the tests, which ships with Node and adds no dependency. No framework and no chart library.

**Spec:** `docs/superpowers/specs/2026-09-14-public-spending-navigator-design.md`

## Global Constraints

- **No dependency.** Not in the page and not in the tests. The page loads no script from a CDN. The tests run with `node --test`, which ships with Node 18 and later.
- **No step of build for the front end.** The browser loads the files that this repository holds. A visitor gets what the repository shows.
- Every file in the repository is in English, in ASD-STE100: sentences of 25 words or fewer, active voice, one idea per sentence. **This rule binds the code and the comments. It does not bind the copy of the product**, which a citizen of Argentina reads in Spanish. See `docs/WRITING_STYLE.md`.
- **The copy of the product is in Spanish.** The name is `En qué la gastan`, with the accent.
- The identifiers keep their Spanish spelling: `camino`, `nodo`, `arbol`, `ejercicio`, `porcion`, `otros`, `miga`, `desviacion`, `procedencia`.
- Every file name is in kebab-case.
- **The threshold of the slice "otros" is 4%, and it is a parameter of one module.** Decision C22 of the spec: the rule belongs to the context Navegacion, and the build never groups.
- **The nivel de control presupuestario is 7.** At that level and above, a deviation against the approved budget means the state spent differently from the vote of the Congress. Below it, the same arithmetic means money moved between the actividades of one proyecto. They are two concepts and the code gives them two names. Decision C23.
- The KPI of the spec: the first pie chart under 1.5 s, and a movement down under 200 ms with no network.

## The contract with the build

The build of the first plan publishes these files under `site/data/`. This plan reads them and never writes them.

```
site/data/manifest.json
site/data/<ejercicio>/institucional.json
site/data/<ejercicio>/objeto/<camino de 9 codigos>.json
site/data/heartbeat.json
```

A nodo of `institucional.json`, with its real values:

```json
"88":   {"n": "Ministerio de Capital Humano", "d": 73826008.379115,
         "p": 50103965.116166, "v": 74312682.225243,
         "g": 73196997.330698, "k": ["0","1","2","3","4"]}
"88-1": {"n": "Ministerio de Capital Humano", "d": 15658.058124,
         "p": 10228.538688, "v": 18871.527486,
         "g": 14543.617759, "k": ["0"]}
```

| Field | Meaning |
|---|---|
| `n` | The name of the nodo |
| `d` | `credito_devengado`, in millions of pesos. **This is the measure the product shows.** |
| `p` | `credito_presupuestado`, what the Congress approved |
| `v` | `credito_vigente`, the limit after the modifications of the year |
| `g` | `credito_pagado` |
| `k` | The codes of the children, not the full caminos |

The key of a nodo is its camino joined with `-`. The nodo `88-1` holds one child, so it is a link of a chain that the navigator removes from the path.

One entry of `manifest.json`:

```json
{"ejercicio": 2025,
 "archivo": "https://dgsiaf-repo.mecon.gob.ar/repository/pa/datasets/2025/credito-anual-2025.zip",
 "publicado": "Wed, 08 Jul 2026 10:39:43 GMT",
 "largo": 3641337,
 "total_devengado": 123533955013701.5,
 "verificado": true,
 "en_este_artefacto": true}
```

**`en_este_artefacto` is false when the build of that day did not publish that exercise.** The navigator must not offer an exercise whose files are absent. This is the gap that the review of the first plan parked for this plan.

## What this plan does not build

**P3, the screen of the fiscal result.** It needs the revenue of the exercise, and the build produces none: `url_recursos` has no caller and the pipeline reads only the total of the spending. P3 and the extension of the build that feeds it are the third plan. The ladder of the execution lives in the data already, so P3 is small once the revenue arrives.

---

## File structure

| File | Responsibility |
|---|---|
| `site/index.html` | The page. It loads the modules and holds the containers. |
| `site/estilo.css` | Every rule of style. |
| `site/app/datos.js` | Read a JSON file once and keep it. The only module that touches the network. |
| `site/app/arbol.js` | Move through the tree: children, the removal of a chain of one child, the miga de pan. |
| `site/app/porciones.js` | The rule of 4% and the slice "otros". |
| `site/app/desviacion.js` | The deviation, and which of the two concepts it is. |
| `site/app/procedencia.js` | The source of a number, coarse high in the tree and exact at the leaf. |
| `site/app/ruta.js` | The URL, and the movement between exercises. |
| `site/app/torta.js` | The pie chart, in SVG. |
| `site/app/pantalla.js` | Draw P1, P2, P2b and P4. |
| `site/app/app.js` | Join the modules and answer a change of the URL. |
| `test/*.test.mjs` | One file per module of logic. |
| `.github/workflows/build.yml` | Add the run of the tests of the front end. |

---

### Task 1: Read a file once and keep it

**Files:**
- Create: `site/app/datos.js`
- Test: `test/datos.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: `RUTA_DATOS`; `claveDeCamino(camino: string[]) -> string`; `caminoDeClave(clave: string) -> string[]`; `cargarJson(ruta, traer?) -> Promise<object>`; `cargarManifiesto(traer?)`; `cargarInstitucional(ejercicio, traer?)`; `cargarObjeto(ejercicio, claveHoja, traer?)`; `olvidar()`.

The parameter `traer` defaults to `fetch` and is the seam the tests drive. **No test may reach the network.**

- [ ] **Step 1: Write the failing test**

Create `test/datos.test.mjs`:

```javascript
import test from "node:test";
import assert from "node:assert/strict";

import {
  cargarInstitucional, cargarJson, caminoDeClave, claveDeCamino, olvidar,
} from "../site/app/datos.js";

function falsoTraer(cuerpo, ok = true, estado = 200) {
  const llamadas = [];
  const traer = async (ruta) => {
    llamadas.push(ruta);
    return { ok, status: estado, json: async () => cuerpo };
  };
  return { traer, llamadas };
}

test("une un camino en una clave", () => {
  assert.equal(claveDeCamino(["88", "1", "0"]), "88-1-0");
  assert.equal(claveDeCamino([]), "");
});

test("parte una clave en un camino", () => {
  assert.deepEqual(caminoDeClave("88-1-0"), ["88", "1", "0"]);
  assert.deepEqual(caminoDeClave(""), []);
});

test("lee el archivo una sola vez", async () => {
  olvidar();
  const { traer, llamadas } = falsoTraer({ "88": { n: "Capital Humano" } });
  const primero = await cargarInstitucional(2025, traer);
  const segundo = await cargarInstitucional(2025, traer);
  assert.equal(llamadas.length, 1, "the second read comes from the memory");
  assert.equal(primero, segundo);
});

test("una respuesta que no es ok levanta un error", async () => {
  olvidar();
  const { traer } = falsoTraer(null, false, 404);
  await assert.rejects(() => cargarJson("data/x.json", traer), /404/);
});
```

- [ ] **Step 2: Run the test and see it fail**

Run: `node --test test/datos.test.mjs`
Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Write the implementation**

Create `site/app/datos.js`:

```javascript
// Read the files that the build publishes.
// This is the only module that touches the network. Every file is read one
// time. The institutional file of one exercise is about 177 KB after gzip, and
// after it arrives a movement inside that axis needs no request.

export const RUTA_DATOS = "data";

const memoria = new Map();

export function olvidar() {
  memoria.clear();
}

export function claveDeCamino(camino) {
  return camino.join("-");
}

export function caminoDeClave(clave) {
  return clave === "" ? [] : clave.split("-");
}

export async function cargarJson(ruta, traer = fetch) {
  if (memoria.has(ruta)) {
    return memoria.get(ruta);
  }
  const respuesta = await traer(ruta);
  if (!respuesta.ok) {
    throw new Error(`${ruta} answered ${respuesta.status}`);
  }
  const datos = await respuesta.json();
  memoria.set(ruta, datos);
  return datos;
}

export function cargarManifiesto(traer) {
  return cargarJson(`${RUTA_DATOS}/manifest.json`, traer);
}

export function cargarInstitucional(ejercicio, traer) {
  return cargarJson(`${RUTA_DATOS}/${ejercicio}/institucional.json`, traer);
}

export function cargarObjeto(ejercicio, claveHoja, traer) {
  return cargarJson(`${RUTA_DATOS}/${ejercicio}/objeto/${claveHoja}.json`, traer);
}
```

- [ ] **Step 4: Run the test and see it pass**

Run: `node --test test/datos.test.mjs`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add site/app/datos.js test/datos.test.mjs
git commit -m "Read a published file one time and keep it"
```

---

### Task 2: Move through the tree, and remove the chains of one child

This task carries the rule that the first plan did not build. 79% of the nodos of a real exercise hold exactly one child, and the longest chain is 7 levels. A pie chart of one child is a full circle of one colour, and it repeats the screen before it.

**Files:**
- Create: `site/app/arbol.js`
- Test: `test/arbol.test.mjs`

**Interfaces:**
- Consumes: nothing. It reads an index that the caller gives it.
- Produces: `NIVELES_INSTITUCIONALES = 9`; `nivelDe(clave) -> number`; `raices(indice) -> string[]`; `hijosDe(indice, clave) -> string[]`; `saltarHijoUnico(indice, clave) -> {destino, saltados}`; `migaDePan(indice, clave) -> {clave, nombre}[]`; `totalDe(indice, claves, medida) -> number`.

- [ ] **Step 1: Write the failing test**

Create `test/arbol.test.mjs`:

```javascript
import test from "node:test";
import assert from "node:assert/strict";

import {
  hijosDe, migaDePan, nivelDe, raices, saltarHijoUnico, totalDe,
} from "../site/app/arbol.js";

// Two jurisdicciones. The 45 is a chain of one child, three levels deep.
const INDICE = {
  "88": { n: "Capital Humano", d: 66, p: 50, v: 70, g: 60, k: ["1", "2"] },
  "88-1": { n: "ANSES", d: 55, p: 40, v: 58, g: 50, k: [] },
  "88-2": { n: "Educacion", d: 11, p: 10, v: 12, g: 10, k: [] },
  "45": { n: "Defensa", d: 31, p: 30, v: 33, g: 30, k: ["1"] },
  "45-1": { n: "Defensa", d: 31, p: 30, v: 33, g: 30, k: ["0"] },
  "45-1-0": { n: "Defensa", d: 31, p: 30, v: 33, g: 30, k: ["7", "8"] },
  "45-1-0-7": { n: "Curso", d: 20, p: 20, v: 21, g: 20, k: [] },
  "45-1-0-8": { n: "Taller", d: 11, p: 10, v: 12, g: 10, k: [] },
};

test("el nivel es el largo del camino", () => {
  assert.equal(nivelDe("88"), 1);
  assert.equal(nivelDe("45-1-0-7"), 4);
  assert.equal(nivelDe(""), 0);
});

test("las raices son las claves sin guion", () => {
  assert.deepEqual(raices(INDICE).sort(), ["45", "88"]);
});

test("los hijos llevan el camino completo", () => {
  assert.deepEqual(hijosDe(INDICE, "88"), ["88-1", "88-2"]);
  assert.deepEqual(hijosDe(INDICE, "88-1"), []);
});

test("salta la cadena hasta el nodo que divide", () => {
  const { destino, saltados } = saltarHijoUnico(INDICE, "45");
  assert.equal(destino, "45-1-0");
  assert.deepEqual(saltados, ["Defensa", "Defensa"]);
});

test("no salta cuando el nodo ya divide", () => {
  const { destino, saltados } = saltarHijoUnico(INDICE, "88");
  assert.equal(destino, "88");
  assert.deepEqual(saltados, []);
});

test("la miga conserva los tramos salteados", () => {
  const miga = migaDePan(INDICE, "45-1-0-7");
  assert.deepEqual(miga.map((t) => t.clave),
    ["45", "45-1", "45-1-0", "45-1-0-7"]);
  assert.equal(miga.at(-1).nombre, "Curso");
});

test("el total suma la medida que se pide", () => {
  assert.equal(totalDe(INDICE, raices(INDICE), "d"), 97);
  assert.equal(totalDe(INDICE, raices(INDICE), "p"), 80);
});
```

- [ ] **Step 2: Run the test and see it fail**

Run: `node --test test/arbol.test.mjs`
Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Write the implementation**

Create `site/app/arbol.js`:

```javascript
// Move through the tree of one exercise.
//
// The identity of a nodo is its full camino and never its last code. A code
// such as `programa_id` repeats between ministries, so a key of one code would
// add the money of two ministries together.

export const NIVELES_INSTITUCIONALES = 9;

export function nivelDe(clave) {
  return clave === "" ? 0 : clave.split("-").length;
}

export function raices(indice) {
  return Object.keys(indice).filter((clave) => !clave.includes("-"));
}

export function hijosDe(indice, clave) {
  const nodo = indice[clave];
  if (!nodo) {
    return [];
  }
  return nodo.k.map((codigo) => `${clave}-${codigo}`);
}

export function saltarHijoUnico(indice, clave) {
  // 79% of the nodos of a real exercise hold one child. Such a nodo shows a
  // circle of one colour, and it repeats the screen before it. The names on
  // the way go to the miga de pan, because the number is not reproducible
  // without them: a visitor sees 2 names where the file needs 9 codes.
  const saltados = [];
  let actual = clave;
  while (indice[actual] && indice[actual].k.length === 1) {
    saltados.push(indice[actual].n);
    actual = `${actual}-${indice[actual].k[0]}`;
  }
  return { destino: actual, saltados };
}

export function migaDePan(indice, clave) {
  if (clave === "") {
    return [];
  }
  const codigos = clave.split("-");
  const tramos = [];
  for (let corte = 1; corte <= codigos.length; corte += 1) {
    const parcial = codigos.slice(0, corte).join("-");
    if (indice[parcial]) {
      tramos.push({ clave: parcial, nombre: indice[parcial].n });
    }
  }
  return tramos;
}

export function totalDe(indice, claves, medida) {
  return claves.reduce((suma, clave) => suma + indice[clave][medida], 0);
}
```

- [ ] **Step 4: Run the test and see it pass**

Run: `node --test test/arbol.test.mjs`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add site/app/arbol.js test/arbol.test.mjs
git commit -m "Move through the tree and remove the chains of one child"
```

---

### Task 3: The rule of 4%, and the slice "otros"

Measured on the real exercise 2025: after this rule a nodo shows a median of 3 slices and never more than 18. No nodo has all of its children below the threshold, so the slice "otros" is never the whole circle.

**Files:**
- Create: `site/app/porciones.js`
- Test: `test/porciones.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: `UMBRAL = 0.04`; `NOMBRE_OTROS = "otros"`; `porcionesDe(indice, claves, medida) -> {total, porciones}`. A porcion is `{nombre, monto, parte, esOtros, destino}`, where `destino` is an array of claves. The array holds one clave for a normal slice and every small clave for the slice "otros".

- [ ] **Step 1: Write the failing test**

Create `test/porciones.test.mjs`:

```javascript
import test from "node:test";
import assert from "node:assert/strict";

import { NOMBRE_OTROS, UMBRAL, porcionesDe } from "../site/app/porciones.js";

const INDICE = {
  "a": { n: "Grande", d: 60 },
  "b": { n: "Media", d: 30 },
  "c": { n: "Chica", d: 3 },
  "d": { n: "Menor", d: 2 },
  "e": { n: "Minima", d: 5 },
};

test("el umbral es cuatro por ciento", () => {
  assert.equal(UMBRAL, 0.04);
});

test("agrupa las porciones abajo del umbral", () => {
  const { total, porciones } = porcionesDe(INDICE, ["a", "b", "c", "d", "e"], "d");
  assert.equal(total, 100);
  assert.deepEqual(porciones.map((p) => p.nombre),
    ["Grande", "Media", "Minima", NOMBRE_OTROS]);
  assert.equal(porciones.at(-1).monto, 5);
  assert.deepEqual(porciones.at(-1).destino.sort(), ["c", "d"]);
});

test("las partes suman uno", () => {
  const { porciones } = porcionesDe(INDICE, ["a", "b", "c", "d", "e"], "d");
  const suma = porciones.reduce((total, p) => total + p.parte, 0);
  assert.ok(Math.abs(suma - 1) < 1e-9, "INV-07: the parts add to the whole");
});

test("ordena de mayor a menor y deja otros al final", () => {
  const { porciones } = porcionesDe(INDICE, ["c", "a", "d", "b", "e"], "d");
  assert.deepEqual(porciones.map((p) => p.monto), [60, 30, 5, 5]);
  assert.equal(porciones.at(-1).esOtros, true);
});

test("sin porciones chicas no arma otros", () => {
  const { porciones } = porcionesDe(INDICE, ["a", "b"], "d");
  assert.equal(porciones.length, 2);
  assert.ok(porciones.every((p) => p.esOtros === false));
});

test("un total de cero no rompe", () => {
  const vacio = { "x": { n: "Sin ejecucion", d: 0 } };
  const { total, porciones } = porcionesDe(vacio, ["x"], "d");
  assert.equal(total, 0);
  assert.deepEqual(porciones, []);
});
```

- [ ] **Step 2: Run the test and see it fail**

Run: `node --test test/porciones.test.mjs`
Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Write the implementation**

Create `site/app/porciones.js`:

```javascript
// Turn the children of a nodo into the slices of a pie chart.
//
// A child below the threshold joins one slice with the name "otros". The
// visitor opens that slice and gets another pie chart, where the parts are a
// part of the total of "otros".
//
// The threshold belongs to this module and not to the build. The published
// file holds every child, because the visitor can open "otros", so the build
// would save nothing by grouping first. A change of this value needs no new
// build.

export const UMBRAL = 0.04;
export const NOMBRE_OTROS = "otros";

export function porcionesDe(indice, claves, medida) {
  const valores = claves.map((clave) => ({
    clave,
    nombre: indice[clave].n,
    monto: indice[clave][medida],
  }));
  const total = valores.reduce((suma, valor) => suma + valor.monto, 0);
  if (total <= 0) {
    return { total, porciones: [] };
  }

  const grandes = valores.filter((valor) => valor.monto / total >= UMBRAL);
  const chicas = valores.filter((valor) => valor.monto / total < UMBRAL);
  grandes.sort((uno, otro) => otro.monto - uno.monto);

  const porciones = grandes.map((valor) => ({
    nombre: valor.nombre,
    monto: valor.monto,
    parte: valor.monto / total,
    esOtros: false,
    destino: [valor.clave],
  }));

  if (chicas.length > 0) {
    const monto = chicas.reduce((suma, valor) => suma + valor.monto, 0);
    porciones.push({
      nombre: NOMBRE_OTROS,
      monto,
      parte: monto / total,
      esOtros: true,
      destino: chicas.map((valor) => valor.clave),
    });
  }
  return { total, porciones };
}
```

- [ ] **Step 4: Run the test and see it pass**

Run: `node --test test/porciones.test.mjs`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add site/app/porciones.js test/porciones.test.mjs
git commit -m "Group the children below 4% into the slice otros"
```

---

### Task 4: The deviation, which is two concepts that share one formula

**Files:**
- Create: `site/app/desviacion.js`
- Test: `test/desviacion.test.mjs`

**Interfaces:**
- Consumes: `site/app/arbol.js` for `nivelDe`.
- Produces: `NIVEL_DE_CONTROL = 7`; `SOBRE_LO_APROBADO`; `REASIGNACION_INTERNA`; `desviacionDe(nodo, clave) -> {valor, tipo} | null`; `ejecucionDe(nodo) -> number | null`.

- [ ] **Step 1: Write the failing test**

Create `test/desviacion.test.mjs`:

```javascript
import test from "node:test";
import assert from "node:assert/strict";

import {
  NIVEL_DE_CONTROL, REASIGNACION_INTERNA, SOBRE_LO_APROBADO,
  desviacionDe, ejecucionDe,
} from "../site/app/desviacion.js";

const NODO = { n: "Capital Humano", d: 132, p: 100, v: 150, g: 120 };

test("el nivel de control es siete", () => {
  assert.equal(NIVEL_DE_CONTROL, 7);
});

test("arriba del nivel de control es sobre lo aprobado", () => {
  const { valor, tipo } = desviacionDe(NODO, "88-1-0-100-21-0-0");
  assert.ok(Math.abs(valor - 0.32) < 1e-9);
  assert.equal(tipo, SOBRE_LO_APROBADO);
});

test("abajo del nivel de control es reasignacion interna", () => {
  const { tipo } = desviacionDe(NODO, "88-1-0-100-21-0-0-1");
  assert.equal(tipo, REASIGNACION_INTERNA,
    "below the proyecto the vigente is a distribution and not a limit");
});

test("el limite exacto cuenta como sobre lo aprobado", () => {
  assert.equal(desviacionDe(NODO, "1-2-3-4-5-6-7").tipo, SOBRE_LO_APROBADO);
  assert.equal(desviacionDe(NODO, "1-2-3-4-5-6-7-8").tipo, REASIGNACION_INTERNA);
});

test("sin aprobado no hay desviacion", () => {
  assert.equal(desviacionDe({ d: 10, p: 0 }, "88"), null);
});

test("la ejecucion es el devengado sobre el vigente", () => {
  assert.ok(Math.abs(ejecucionDe(NODO) - 0.88) < 1e-9);
  assert.equal(ejecucionDe({ d: 10, v: 0 }), null);
});
```

- [ ] **Step 2: Run the test and see it fail**

Run: `node --test test/desviacion.test.mjs`
Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Write the implementation**

Create `site/app/desviacion.js`:

```javascript
// The difference between what the state spent and what the Congress approved.
//
// The same arithmetic names two different facts, and the level decides which.
// At the level of the proyecto and above, the credito vigente is a legal limit,
// so the difference says the state spent differently from the vote of the
// Congress. Below that level the number is an internal distribution, and money
// moves between the actividades of one proyecto.
//
// Measured on the exercise 2025: 0 exceptions in 2,673 nodos at the proyecto
// level and above, and 12.7% of the actividades break it. Of the 303
// actividades that pass their own vigente, the parent proyecto respects its
// limit in 303 of 303 cases.
//
// The two values of the type stop a screen from showing one and naming it the
// other.

import { nivelDe } from "./arbol.js";

export const NIVEL_DE_CONTROL = 7;
export const SOBRE_LO_APROBADO = "sobre-lo-aprobado";
export const REASIGNACION_INTERNA = "reasignacion-interna";

export function desviacionDe(nodo, clave) {
  if (!nodo || !nodo.p) {
    return null;
  }
  const tipo = nivelDe(clave) <= NIVEL_DE_CONTROL
    ? SOBRE_LO_APROBADO
    : REASIGNACION_INTERNA;
  return { valor: nodo.d / nodo.p - 1, tipo };
}

export function ejecucionDe(nodo) {
  if (!nodo || !nodo.v) {
    return null;
  }
  return nodo.d / nodo.v;
}
```

- [ ] **Step 4: Run the test and see it pass**

Run: `node --test test/desviacion.test.mjs`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add site/app/desviacion.js test/desviacion.test.mjs
git commit -m "Name the deviation by the level that decides its meaning"
```

---

### Task 5: The source of a number, coarse high and exact at the leaf

The source goes down with the visitor. High in the tree it names the file and the date. At the lowest nodo of a branch it names the codes that identify the rows, and **those codes include the segments that the navigator removed**. Without them the number is not reproducible: a visitor sees 2 names where the file needs 9 codes.

**Files:**
- Create: `site/app/procedencia.js`
- Test: `test/procedencia.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: `EJES` (13 names, in order); `etiquetarCodigos(clave) -> {eje, codigo}[]`; `consultaDe(clave) -> string`; `procedenciaDe(entrada, indice, clave) -> {archivo, fecha, codigos}`. `codigos` is `null` unless the nodo is a leaf.

- [ ] **Step 1: Write the failing test**

Create `test/procedencia.test.mjs`:

```javascript
import test from "node:test";
import assert from "node:assert/strict";

import {
  EJES, consultaDe, etiquetarCodigos, procedenciaDe,
} from "../site/app/procedencia.js";

const ENTRADA = {
  ejercicio: 2025,
  archivo: "https://dgsiaf-repo.mecon.gob.ar/repository/pa/datasets/2025/credito-anual-2025.zip",
  publicado: "Wed, 08 Jul 2026 10:39:43 GMT",
};
const INDICE = {
  "88": { n: "Capital Humano", d: 66, k: ["1"] },
  "88-1": { n: "ANSES", d: 66, k: [] },
};

test("los ejes son trece y empiezan por la jurisdiccion", () => {
  assert.equal(EJES.length, 13);
  assert.equal(EJES[0], "jurisdiccion");
  assert.equal(EJES.at(-1), "subparcial");
});

test("un nodo con hijos muestra el archivo y la fecha, sin codigos", () => {
  const procedencia = procedenciaDe(ENTRADA, INDICE, "88");
  assert.equal(procedencia.fecha, ENTRADA.publicado);
  assert.ok(procedencia.archivo.includes("credito-anual-2025.zip"));
  assert.equal(procedencia.codigos, null);
});

test("una hoja muestra los codigos exactos", () => {
  const procedencia = procedenciaDe(ENTRADA, INDICE, "88-1");
  assert.deepEqual(procedencia.codigos, [
    { eje: "jurisdiccion", codigo: "88" },
    { eje: "subjurisdiccion", codigo: "1" },
  ]);
});

test("los codigos llevan los tramos que el navegador saltea", () => {
  const codigos = etiquetarCodigos("40-8-0-349-21-0-0-1-0");
  assert.equal(codigos.length, 9,
    "the visitor saw 2 names and the file needs 9 codes");
  assert.equal(codigos.at(3).eje, "servicio");
  assert.equal(codigos.at(3).codigo, "349");
});

test("la consulta se lee como un filtro del archivo", () => {
  assert.equal(consultaDe("88-1"),
    "jurisdiccion_id=88 AND subjurisdiccion_id=1");
});
```

- [ ] **Step 2: Run the test and see it fail**

Run: `node --test test/procedencia.test.mjs`
Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Write the implementation**

Create `site/app/procedencia.js`:

```javascript
// Where a number comes from.
//
// The source goes down with the visitor. High in the tree it names the file and
// the date of publication. At the lowest nodo of a branch it names the codes
// that identify the rows.
//
// The codes carry every segment of the camino, and the navigator removed some
// of them from the path. A visitor of the Procuracion del Tesoro sees 2 names,
// and the file needs 9 codes to find those rows. A source that showed only the
// visible path would give a number that nobody can reproduce.

export const EJES = [
  "jurisdiccion", "subjurisdiccion", "entidad", "servicio", "programa",
  "subprograma", "proyecto", "actividad", "obra", "inciso", "principal",
  "parcial", "subparcial",
];

export function etiquetarCodigos(clave) {
  return clave.split("-").map((codigo, posicion) => ({
    eje: EJES[posicion],
    codigo,
  }));
}

export function consultaDe(clave) {
  return etiquetarCodigos(clave)
    .map(({ eje, codigo }) => `${eje}_id=${codigo}`)
    .join(" AND ");
}

export function procedenciaDe(entrada, indice, clave) {
  const nodo = indice[clave];
  const esHoja = Boolean(nodo) && nodo.k.length === 0;
  return {
    archivo: entrada.archivo,
    fecha: entrada.publicado,
    codigos: esHoja ? etiquetarCodigos(clave) : null,
  };
}
```

- [ ] **Step 4: Run the test and see it pass**

Run: `node --test test/procedencia.test.mjs`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add site/app/procedencia.js test/procedencia.test.mjs
git commit -m "Take the source of a number down with the visitor"
```

---

### Task 6: The URL, and the movement between exercises

**The arrow changes the exercise and nothing else.** It never moves the visitor in the tree. When the camino does not exist in the new exercise, the visitor lands on P2b, which says so and gives two exits.

That screen is not rare. Measured between 2025 and 2026: every jurisdiccion survives, 19% of the servicios do not, and 52% of the actividades do not.

**Files:**
- Create: `site/app/ruta.js`
- Test: `test/ruta.test.mjs`

**Interfaces:**
- Consumes: `site/app/arbol.js` for `nivelDe`.
- Produces: `leerRuta(hash) -> {ejercicio, clave}`; `escribirRuta(ejercicio, clave) -> string`; `ejerciciosDisponibles(manifiesto) -> number[]`; `ejercicioDeEntrada(disponibles, hoy?) -> number`; `vecino(disponibles, ejercicio, paso) -> number | null`; `ancestroQueExiste(indice, clave) -> string | null`.

- [ ] **Step 1: Write the failing test**

Create `test/ruta.test.mjs`:

```javascript
import test from "node:test";
import assert from "node:assert/strict";

import {
  ancestroQueExiste, ejercicioDeEntrada, ejerciciosDisponibles, escribirRuta,
  leerRuta, vecino,
} from "../site/app/ruta.js";

const MANIFIESTO = {
  ejercicios: [
    { ejercicio: 2024, en_este_artefacto: true },
    { ejercicio: 2025, en_este_artefacto: true },
    { ejercicio: 2026, en_este_artefacto: false },
  ],
};

test("lee el ejercicio y el camino de la url", () => {
  assert.deepEqual(leerRuta("#/2025/88-1-0"), { ejercicio: 2025, clave: "88-1-0" });
  assert.deepEqual(leerRuta("#/2025"), { ejercicio: 2025, clave: "" });
  assert.deepEqual(leerRuta(""), { ejercicio: null, clave: "" });
});

test("escribe una url que se puede compartir", () => {
  assert.equal(escribirRuta(2025, "88-1-0"), "#/2025/88-1-0");
  assert.equal(escribirRuta(2025, ""), "#/2025");
});

test("un ejercicio que no esta en el artefacto no se ofrece", () => {
  assert.deepEqual(ejerciciosDisponibles(MANIFIESTO), [2024, 2025],
    "the build of that day published no data for 2026");
});

test("la entrada muestra el ultimo ejercicio cerrado", () => {
  // Decision C2 of the spec. The open exercise is not complete, so the entry
  // shows the last one that closed.
  assert.equal(ejercicioDeEntrada([2024, 2025, 2026], 2026), 2025);
  // The build of that day did not publish 2026. The last closed one is still
  // 2025, so a rule of "the one before the last available" would give 2024.
  assert.equal(ejercicioDeEntrada([2024, 2025], 2026), 2025);
  // Nothing is closed yet. Show what there is.
  assert.equal(ejercicioDeEntrada([2026], 2026), 2026);
});

test("el vecino respeta el orden y los bordes", () => {
  const anios = [2024, 2025];
  assert.equal(vecino(anios, 2024, 1), 2025);
  assert.equal(vecino(anios, 2025, -1), 2024);
  assert.equal(vecino(anios, 2025, 1), null);
  assert.equal(vecino(anios, 2024, -1), null);
});

test("sube al ancestro que existe en el otro ejercicio", () => {
  const indice = { "88": { n: "Capital Humano", k: ["1"] },
                   "88-1": { n: "ANSES", k: [] } };
  assert.equal(ancestroQueExiste(indice, "88-1-9-9"), "88-1");
  assert.equal(ancestroQueExiste(indice, "88-1"), "88-1");
  assert.equal(ancestroQueExiste(indice, "77-7"), null);
});
```

- [ ] **Step 2: Run the test and see it fail**

Run: `node --test test/ruta.test.mjs`
Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Write the implementation**

Create `site/app/ruta.js`:

```javascript
// The URL of one view, and the movement between exercises.
//
// The URL carries the exercise and the camino, so a shared link always opens
// what its author saw. Only the arrow crosses exercises.
//
// The arrow changes the exercise and nothing else. It never moves the visitor
// in the tree. A rule that moved the exercise and the position at the same time
// would make one action produce two changes.

export function leerRuta(hash) {
  const partes = (hash || "").replace(/^#\/?/, "").split("/");
  const ejercicio = Number.parseInt(partes[0], 10);
  return {
    ejercicio: Number.isFinite(ejercicio) ? ejercicio : null,
    clave: partes[1] || "",
  };
}

export function escribirRuta(ejercicio, clave) {
  return clave === "" ? `#/${ejercicio}` : `#/${ejercicio}/${clave}`;
}

export function ejerciciosDisponibles(manifiesto) {
  // An exercise whose build failed that day holds no file in the artifact. Its
  // entry stays in the manifest, because its total is the baseline of the next
  // build, and the navigator must not offer it.
  return manifiesto.ejercicios
    .filter((entrada) => entrada.en_este_artefacto !== false)
    .map((entrada) => entrada.ejercicio)
    .sort((uno, otro) => uno - otro);
}

export function ejercicioDeEntrada(disponibles, hoy = new Date().getFullYear()) {
  // The entry shows the last closed exercise. The open one is not complete, so
  // its pie chart is smaller by the calendar and not by a policy.
  //
  // The rule reads the year and not the position in the list. An exercise that
  // failed its build that day is absent from the list, so a rule of "the one
  // before the last" would step back one year too far.
  const cerrados = disponibles.filter((ejercicio) => ejercicio < hoy);
  return cerrados.at(-1) ?? disponibles.at(-1);
}

export function vecino(disponibles, ejercicio, paso) {
  const posicion = disponibles.indexOf(ejercicio);
  if (posicion < 0) {
    return null;
  }
  return disponibles[posicion + paso] ?? null;
}

export function ancestroQueExiste(indice, clave) {
  const codigos = clave.split("-");
  for (let corte = codigos.length; corte > 0; corte -= 1) {
    const parcial = codigos.slice(0, corte).join("-");
    if (indice[parcial]) {
      return parcial;
    }
  }
  return null;
}
```

- [ ] **Step 4: Run the test and see it pass**

Run: `node --test test/ruta.test.mjs`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add site/app/ruta.js test/ruta.test.mjs
git commit -m "Carry the exercise and the camino in the URL"
```

---

### Task 7: The pie chart

The pie chart stays at every level, because the slice "otros" keeps the count of slices low: a median of 3, and never more than 18.

Two cases need care. A nodo with one visible slice draws a full circle and not an arc of 360 degrees, because an arc of a full turn collapses to a point. And every slice is a target that a finger can hit, so no slice is drawn thinner than the minimum that the style sets.

**Files:**
- Create: `site/app/torta.js`
- Test: `test/torta.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: `RADIO = 100`; `CENTRO = 110`; `caminoDeArco(desde, hasta) -> string`; `dibujarTorta(porciones, documento) -> SVGElement`. `documento` defaults to the global `document` and is the seam the tests drive.

- [ ] **Step 1: Write the failing test**

Create `test/torta.test.mjs`:

```javascript
import test from "node:test";
import assert from "node:assert/strict";

import { caminoDeArco, dibujarTorta } from "../site/app/torta.js";

// A small stand-in for the document. The test needs no browser.
function falsoDocumento() {
  const crear = (etiqueta) => ({
    etiqueta,
    atributos: {},
    hijos: [],
    textContent: "",
    setAttribute(nombre, valor) { this.atributos[nombre] = valor; },
    appendChild(hijo) { this.hijos.push(hijo); return hijo; },
  });
  return { createElementNS: (espacio, etiqueta) => crear(etiqueta) };
}

const PORCIONES = [
  { nombre: "Capital Humano", monto: 60, parte: 0.6, esOtros: false, destino: ["88"] },
  { nombre: "Deuda", monto: 30, parte: 0.3, esOtros: false, destino: ["90"] },
  { nombre: "otros", monto: 10, parte: 0.1, esOtros: true, destino: ["1", "2"] },
];

test("un arco de media vuelta lleva la bandera del arco grande en cero", () => {
  const camino = caminoDeArco(0, Math.PI);
  assert.match(camino, / 0 1 /, "half a turn is not the large arc");
});

test("un arco de tres cuartos lleva la bandera en uno", () => {
  const camino = caminoDeArco(0, Math.PI * 1.5);
  assert.match(camino, / 1 1 /);
});

test("dibuja una porcion por cada entrada", () => {
  const svg = dibujarTorta(PORCIONES, falsoDocumento());
  const formas = svg.hijos.filter((hijo) => hijo.etiqueta === "path");
  assert.equal(formas.length, 3);
});

test("cada porcion lleva su destino y su nombre accesible", () => {
  const svg = dibujarTorta(PORCIONES, falsoDocumento());
  const primera = svg.hijos[0];
  assert.equal(primera.atributos["data-destino"], "88");
  assert.match(primera.hijos[0].textContent, /Capital Humano/);
  assert.match(primera.hijos[0].textContent, /60/);
});

test("una sola porcion dibuja un circulo y no un arco", () => {
  const sola = [{ nombre: "Unica", monto: 10, parte: 1, esOtros: false, destino: ["9"] }];
  const svg = dibujarTorta(sola, falsoDocumento());
  assert.equal(svg.hijos.filter((h) => h.etiqueta === "circle").length, 1);
  assert.equal(svg.hijos.filter((h) => h.etiqueta === "path").length, 0);
});

test("la porcion otros lleva su marca", () => {
  const svg = dibujarTorta(PORCIONES, falsoDocumento());
  assert.equal(svg.hijos.at(-1).atributos["data-otros"], "si");
});
```

- [ ] **Step 2: Run the test and see it fail**

Run: `node --test test/torta.test.mjs`
Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Write the implementation**

Create `site/app/torta.js`:

```javascript
// The pie chart, drawn as SVG.
//
// The chart stays at every level. The slice "otros" keeps the number of slices
// low: a real exercise gives a median of 3 slices and never more than 18.

const ESPACIO = "http://www.w3.org/2000/svg";

export const RADIO = 100;
export const CENTRO = 110;

function punto(angulo) {
  return {
    x: CENTRO + RADIO * Math.cos(angulo - Math.PI / 2),
    y: CENTRO + RADIO * Math.sin(angulo - Math.PI / 2),
  };
}

export function caminoDeArco(desde, hasta) {
  const inicio = punto(desde);
  const fin = punto(hasta);
  const grande = hasta - desde > Math.PI ? 1 : 0;
  return [
    `M ${CENTRO} ${CENTRO}`,
    `L ${inicio.x.toFixed(3)} ${inicio.y.toFixed(3)}`,
    `A ${RADIO} ${RADIO} 0 ${grande} 1 ${fin.x.toFixed(3)} ${fin.y.toFixed(3)}`,
    "Z",
  ].join(" ");
}

function porCiento(parte) {
  return `${(parte * 100).toFixed(1)}%`;
}

export function dibujarTorta(porciones, documento = document) {
  const svg = documento.createElementNS(ESPACIO, "svg");
  svg.setAttribute("viewBox", `0 0 ${CENTRO * 2} ${CENTRO * 2}`);
  svg.setAttribute("role", "list");
  svg.setAttribute("class", "torta");

  // One slice fills the circle. An arc of a full turn collapses to a point,
  // so that case draws a circle.
  if (porciones.length === 1) {
    const circulo = documento.createElementNS(ESPACIO, "circle");
    circulo.setAttribute("cx", CENTRO);
    circulo.setAttribute("cy", CENTRO);
    circulo.setAttribute("r", RADIO);
    circulo.setAttribute("class", "porcion porcion-0");
    circulo.setAttribute("data-destino", porciones[0].destino.join(" "));
    circulo.setAttribute("role", "listitem");
    circulo.setAttribute("tabindex", "0");
    const titulo = documento.createElementNS(ESPACIO, "title");
    titulo.textContent = `${porciones[0].nombre}, ${porCiento(1)}`;
    circulo.appendChild(titulo);
    svg.appendChild(circulo);
    return svg;
  }

  let angulo = 0;
  porciones.forEach((porcion, orden) => {
    const hasta = angulo + porcion.parte * Math.PI * 2;
    const forma = documento.createElementNS(ESPACIO, "path");
    forma.setAttribute("d", caminoDeArco(angulo, hasta));
    forma.setAttribute("class", `porcion porcion-${orden}`);
    forma.setAttribute("data-destino", porcion.destino.join(" "));
    forma.setAttribute("role", "listitem");
    forma.setAttribute("tabindex", "0");
    if (porcion.esOtros) {
      forma.setAttribute("data-otros", "si");
    }
    const titulo = documento.createElementNS(ESPACIO, "title");
    titulo.textContent = `${porcion.nombre}, ${porCiento(porcion.parte)}`;
    forma.appendChild(titulo);
    svg.appendChild(forma);
    angulo = hasta;
  });
  return svg;
}
```

- [ ] **Step 4: Run the test and see it pass**

Run: `node --test test/torta.test.mjs`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add site/app/torta.js test/torta.test.mjs
git commit -m "Draw the pie chart as SVG"
```

---

### Task 8: Write a number the way a reader of Argentina reads it

The data holds millions of pesos. A screen that printed `123533955.013701` tells nobody anything. The product must give the figure in full when the reader wants to check it, and in a short form when it only has to be understood.

**Files:**
- Create: `site/app/formato.js`
- Test: `test/formato.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: `pesosDe(millones) -> number`; `montoLargo(millones) -> string`; `montoCorto(millones) -> string`; `porcentaje(parte, decimales?) -> string`; `conSigno(parte) -> string`.

- [ ] **Step 1: Write the failing test**

Create `test/formato.test.mjs`:

```javascript
import test from "node:test";
import assert from "node:assert/strict";

import {
  conSigno, montoCorto, montoLargo, pesosDe, porcentaje,
} from "../site/app/formato.js";

test("un millon de la fuente son un millon de pesos por uno", () => {
  assert.equal(pesosDe(1), 1_000_000);
  assert.equal(pesosDe(123_533_955.013701), 123_533_955_013_701);
});

test("el monto largo se lee con puntos de miles", () => {
  assert.equal(montoLargo(123_533_955.013701), "123.533.955.013.701");
});

test("el monto corto usa la escala larga del castellano", () => {
  assert.equal(montoCorto(123_533_955.013701), "123,5 billones");
  assert.equal(montoCorto(73_826_008.379115), "73,8 billones");
  assert.equal(montoCorto(1_200), "1,2 millones");
  assert.equal(montoCorto(0.5), "500.000");
});

test("el porcentaje redondea a un decimal", () => {
  assert.equal(porcentaje(0.598), "59,8%");
  assert.equal(porcentaje(0.961), "96,1%");
});

test("el signo dice de que lado esta la desviacion", () => {
  assert.equal(conSigno(0.31), "+31%");
  assert.equal(conSigno(-0.41), "-41%");
  assert.equal(conSigno(0), "0%");
});
```

- [ ] **Step 2: Run the test and see it fail**

Run: `node --test test/formato.test.mjs`
Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Write the implementation**

Create `site/app/formato.js`:

```javascript
// Write a number for a reader of Argentina.
//
// The source holds millions of pesos. The copy of this product is in Spanish,
// so a thousand separator is a point and a decimal separator is a comma. The
// scale is the long one of Spanish: a billon is a million millions.

const LOCAL = "es-AR";

export function pesosDe(millones) {
  return Math.round(millones * 1_000_000);
}

export function montoLargo(millones) {
  return new Intl.NumberFormat(LOCAL).format(pesosDe(millones));
}

export function montoCorto(millones) {
  const pesos = pesosDe(millones);
  const escalas = [
    [1e12, "billones"],
    [1e6, "millones"],
  ];
  for (const [tamanio, nombre] of escalas) {
    if (Math.abs(pesos) >= tamanio) {
      const valor = new Intl.NumberFormat(LOCAL, {
        minimumFractionDigits: 1, maximumFractionDigits: 1,
      }).format(pesos / tamanio);
      return `${valor} ${nombre}`;
    }
  }
  return new Intl.NumberFormat(LOCAL).format(pesos);
}

export function porcentaje(parte, decimales = 1) {
  return `${new Intl.NumberFormat(LOCAL, {
    minimumFractionDigits: decimales, maximumFractionDigits: decimales,
  }).format(parte * 100)}%`;
}

export function conSigno(parte) {
  const redondo = Math.round(parte * 100);
  const signo = redondo > 0 ? "+" : "";
  return `${signo}${new Intl.NumberFormat(LOCAL).format(redondo)}%`;
}
```

- [ ] **Step 4: Run the test and see it pass**

Run: `node --test test/formato.test.mjs`
Expected: PASS, 5 tests.

**If a test fails on the exact text**, read the output before you change the code. `Intl` gives the separators of the locale, and the expected values above come from `es-AR`. Report a difference rather than editing the expected value, because that difference would mean the reader sees another format.

- [ ] **Step 5: Commit**

```bash
git add site/app/formato.js test/formato.test.mjs
git commit -m "Write a number for a reader of Argentina"
```

---

### Task 9: The page, and the screen of the root

**Files:**
- Create: `site/index.html`
- Create: `site/estilo.css`
- Create: `site/app/pantalla.js`
- Create: `site/app/app.js`
- Create: `test/falso-documento.mjs`
- Test: `test/pantalla.test.mjs`

**Interfaces:**
- Consumes: every module of tasks 1 to 8.
- Produces: `vistaDeRaiz(estado) -> {titulo, total, ejecucion, desviacion, porciones, procedencia, anios}`; `dibujarRaiz(vista, documento) -> Element`. `estado` is `{ejercicio, entrada, indice, disponibles}`.

**The split matters.** `vistaDeRaiz` decides what the screen says and holds no DOM, so a test reads it directly. `dibujarRaiz` turns that into elements. Keep every decision in the first one.

- [ ] **Step 1: Write the failing test**

Create `test/falso-documento.mjs`:

```javascript
// A small stand-in for the document, so a test needs no browser.
export function falsoDocumento() {
  const crear = (etiqueta) => ({
    etiqueta,
    atributos: {},
    hijos: [],
    textContent: "",
    setAttribute(nombre, valor) { this.atributos[nombre] = valor; },
    appendChild(hijo) { this.hijos.push(hijo); return hijo; },
  });
  return {
    createElement: crear,
    createElementNS: (espacio, etiqueta) => crear(etiqueta),
  };
}

export function textoDe(elemento) {
  const propio = elemento.textContent || "";
  return [propio, ...elemento.hijos.map(textoDe)].join(" ");
}
```

Create `test/pantalla.test.mjs`:

```javascript
import test from "node:test";
import assert from "node:assert/strict";

import { dibujarRaiz, vistaDeRaiz } from "../site/app/pantalla.js";
import { falsoDocumento, textoDe } from "./falso-documento.mjs";

const ESTADO = {
  ejercicio: 2025,
  disponibles: [2024, 2025],
  entrada: {
    ejercicio: 2025,
    archivo: "https://dgsiaf-repo.mecon.gob.ar/repository/pa/datasets/2025/credito-anual-2025.zip",
    publicado: "Wed, 08 Jul 2026 10:39:43 GMT",
  },
  indice: {
    "88": { n: "Capital Humano", d: 60, p: 40, v: 62, g: 55, k: ["1"] },
    "88-1": { n: "ANSES", d: 60, p: 40, v: 62, g: 55, k: [] },
    "90": { n: "Deuda", d: 30, p: 30, v: 31, g: 30, k: [] },
    "50": { n: "Economia", d: 10, p: 12, v: 11, g: 10, k: [] },
  },
};

test("la vista suma el total de las jurisdicciones", () => {
  const vista = vistaDeRaiz(ESTADO);
  assert.equal(vista.total, 100);
});

test("la vista da la ejecucion y la desviacion del ejercicio", () => {
  const vista = vistaDeRaiz(ESTADO);
  assert.ok(Math.abs(vista.ejecucion - 100 / 104) < 1e-9);
  assert.ok(Math.abs(vista.desviacion.valor - (100 / 82 - 1)) < 1e-9);
});

test("la vista ofrece solo los ejercicios que estan", () => {
  assert.deepEqual(vistaDeRaiz(ESTADO).anios, [2024, 2025]);
});

test("la procedencia de la raiz no lleva codigos", () => {
  assert.equal(vistaDeRaiz(ESTADO).procedencia.codigos, null);
});

test("la pantalla nombra el ejercicio, el total y la fuente", () => {
  const elemento = dibujarRaiz(vistaDeRaiz(ESTADO), falsoDocumento());
  const texto = textoDe(elemento);
  assert.match(texto, /2025/);
  assert.match(texto, /100\.000\.000/, "the total in full pesos");
  assert.match(texto, /credito-anual-2025/, "UC-06: every screen names its source");
});
```

- [ ] **Step 2: Run the test and see it fail**

Run: `node --test test/pantalla.test.mjs`
Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Write the implementation**

Create `site/app/pantalla.js`:

```javascript
// Turn the data of one exercise into what a screen says, and then into
// elements.
//
// Every decision lives in the functions that give a view. The functions that
// draw hold no decision, so a test reads a view without a browser.

import { raices, totalDe } from "./arbol.js";
import { desviacionDe, ejecucionDe } from "./desviacion.js";
import { conSigno, montoCorto, montoLargo, porcentaje } from "./formato.js";
import { porcionesDe } from "./porciones.js";
import { procedenciaDe } from "./procedencia.js";
import { dibujarTorta } from "./torta.js";

function totalesDeLaRaiz(indice) {
  const claves = raices(indice);
  return {
    claves,
    d: totalDe(indice, claves, "d"),
    p: totalDe(indice, claves, "p"),
    v: totalDe(indice, claves, "v"),
    g: totalDe(indice, claves, "g"),
  };
}

export function vistaDeRaiz(estado) {
  const { indice, entrada, ejercicio, disponibles } = estado;
  const totales = totalesDeLaRaiz(indice);
  const comoNodo = { n: "", d: totales.d, p: totales.p, v: totales.v, g: totales.g };
  return {
    ejercicio,
    anios: disponibles,
    titulo: "En qué la gastó el Estado nacional",
    total: totales.d,
    ejecucion: ejecucionDe(comoNodo),
    desviacion: desviacionDe(comoNodo, "1"),
    porciones: porcionesDe(indice, totales.claves, "d").porciones,
    procedencia: procedenciaDe(entrada, indice, ""),
  };
}

function texto(documento, etiqueta, contenido, clase) {
  const elemento = documento.createElement(etiqueta);
  elemento.textContent = contenido;
  if (clase) {
    elemento.setAttribute("class", clase);
  }
  return elemento;
}

export function dibujarTiraDeAnios(vista, documento) {
  const tira = documento.createElement("nav");
  tira.setAttribute("class", "anios");
  tira.setAttribute("aria-label", "Ejercicio");
  for (const anio of vista.anios) {
    const boton = texto(documento, "button", String(anio), "anio");
    boton.setAttribute("data-anio", String(anio));
    if (anio === vista.ejercicio) {
      boton.setAttribute("aria-current", "true");
    }
    tira.appendChild(boton);
  }
  return tira;
}

export function dibujarProcedencia(procedencia, documento) {
  const pie = documento.createElement("footer");
  pie.setAttribute("class", "procedencia");
  const archivo = procedencia.archivo.split("/").pop();
  pie.appendChild(texto(documento, "p",
    `Fuente: Presupuesto Abierto · ${archivo} · ${procedencia.fecha}`));
  if (procedencia.codigos) {
    const lista = procedencia.codigos
      .map(({ eje, codigo }) => `${eje}_id=${codigo}`)
      .join(" · ");
    pie.appendChild(texto(documento, "p", lista, "codigos"));
  }
  return pie;
}

export function dibujarRaiz(vista, documento = document) {
  const seccion = documento.createElement("section");
  seccion.setAttribute("class", "pantalla pantalla-raiz");
  seccion.appendChild(dibujarTiraDeAnios(vista, documento));
  seccion.appendChild(texto(documento, "h1", vista.titulo));

  const cifra = documento.createElement("p");
  cifra.setAttribute("class", "total");
  cifra.textContent = `${montoLargo(vista.total)} pesos`;
  seccion.appendChild(cifra);

  const detalle = [];
  if (vista.ejecucion !== null) {
    detalle.push(`${porcentaje(vista.ejecucion)} de lo autorizado`);
  }
  if (vista.desviacion) {
    detalle.push(`${conSigno(vista.desviacion.valor)} sobre lo aprobado`);
  }
  seccion.appendChild(texto(documento, "p", detalle.join(" · "), "detalle"));

  seccion.appendChild(dibujarTorta(vista.porciones, documento));

  const leyenda = documento.createElement("ul");
  leyenda.setAttribute("class", "leyenda");
  vista.porciones.forEach((porcion, orden) => {
    const fila = texto(documento, "li",
      `${porcion.nombre} · ${porcentaje(porcion.parte)} · ${montoCorto(porcion.monto)}`,
      `leyenda-${orden}`);
    fila.setAttribute("data-destino", porcion.destino.join(" "));
    leyenda.appendChild(fila);
  });
  seccion.appendChild(leyenda);

  seccion.appendChild(dibujarProcedencia(vista.procedencia, documento));
  return seccion;
}
```

Create `site/index.html`:

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>En qué la gastan</title>
    <meta name="description"
          content="Un mapa navegable del gasto público del Estado nacional argentino." />
    <link rel="stylesheet" href="estilo.css" />
  </head>
  <body>
    <main id="app" aria-live="polite">
      <p class="cargando">Cargando el gasto público…</p>
    </main>
    <script type="module" src="app/app.js"></script>
  </body>
</html>
```

Create `site/app/app.js`:

```javascript
// Join the modules, and answer a change of the URL.

import { cargarInstitucional, cargarManifiesto } from "./datos.js";
import { dibujarRaiz, vistaDeRaiz } from "./pantalla.js";
import {
  ejercicioDeEntrada, ejerciciosDisponibles, escribirRuta, leerRuta,
} from "./ruta.js";

const app = document.getElementById("app");

function vaciar(elemento) {
  while (elemento.firstChild) {
    elemento.removeChild(elemento.firstChild);
  }
}

async function dibujar() {
  const manifiesto = await cargarManifiesto();
  const disponibles = ejerciciosDisponibles(manifiesto);
  const pedido = leerRuta(window.location.hash);
  const ejercicio = disponibles.includes(pedido.ejercicio)
    ? pedido.ejercicio
    : ejercicioDeEntrada(disponibles);

  const entrada = manifiesto.ejercicios
    .find((fila) => fila.ejercicio === ejercicio);
  const indice = await cargarInstitucional(ejercicio);
  const estado = { ejercicio, entrada, indice, disponibles };

  vaciar(app);
  app.appendChild(dibujarRaiz(vistaDeRaiz(estado), document));
}

app.addEventListener("click", (evento) => {
  const anio = evento.target.closest("[data-anio]");
  if (anio) {
    window.location.hash = escribirRuta(Number(anio.dataset.anio), "");
  }
});

window.addEventListener("hashchange", () => {
  dibujar().catch(informar);
});

function informar(error) {
  vaciar(app);
  const aviso = document.createElement("p");
  aviso.className = "error";
  aviso.textContent = `No pudimos cargar los datos. ${error.message}`;
  app.appendChild(aviso);
}

dibujar().catch(informar);
```

**The entry shows the last closed exercise**, which `ejercicioDeEntrada` of task 6 decides by the year and not by the position. Decision C2 of the spec.

Create `site/estilo.css`:

```css
/* The smallest set of rules that makes the screen readable. Task 12 refines
   this with the skills of design. */
:root {
  --tinta: #1a1a1a;
  --fondo: #fbfbf9;
  --tenue: #6b6b6b;
  color-scheme: light;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--fondo);
  color: var(--tinta);
  font: 16px/1.5 system-ui, sans-serif;
}
main { max-width: 40rem; margin: 0 auto; padding: 1rem; }
h1 { font-size: 1.5rem; line-height: 1.2; margin: 0.5rem 0; }
.total { font-size: 1.75rem; font-weight: 700; margin: 0; }
.detalle { color: var(--tenue); margin: 0.25rem 0 1.5rem; }
.anios, .miga { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
button { font: inherit; cursor: pointer; border: 1px solid var(--tinta);
         background: transparent; border-radius: 0.5rem; padding: 0.5rem 0.75rem; }
button[aria-current="true"] { background: var(--tinta); color: var(--fondo); }
:focus-visible { outline: 3px solid #0b57d0; outline-offset: 2px; }
.torta { width: 100%; height: auto; max-width: 22rem; display: block;
         margin: 0 auto 1rem; }
.porcion { cursor: pointer; stroke: var(--fondo); stroke-width: 2; }
.porcion-0 { fill: #2b4a7d; } .porcion-1 { fill: #3e6ea8; }
.porcion-2 { fill: #5f93c4; } .porcion-3 { fill: #86b4d8; }
.porcion-4 { fill: #aed0e8; } .porcion-5 { fill: #c9def0; }
.porcion-6 { fill: #dceaf6; } .porcion-7 { fill: #8a8a8a; }
.porcion[data-otros] { fill: #9a9a9a; }
.leyenda { list-style: none; padding: 0; margin: 0 0 2rem; }
.leyenda li { cursor: pointer; padding: 0.6rem 0.25rem;
              border-bottom: 1px solid #e6e6e2; }
.procedencia { border-top: 1px solid #e6e6e2; padding-top: 0.75rem;
               color: var(--tenue); font-size: 0.875rem; }
.procedencia .codigos { font-family: ui-monospace, monospace; word-break: break-all; }
```

**This is a floor and not a design.** Task 12 refines it with the skills that this machine holds.

- [ ] **Step 4: Run the test and see it pass**

Run: `node --test test/pantalla.test.mjs`
Expected: PASS, 5 tests.

- [ ] **Step 5: See it in a browser**

Run: `python3 -m http.server 8000 --directory site` and open `http://localhost:8000`. The build must have written `site/data` first, with `python -m build --destino site/data`.

Confirm the pie chart of 2025 appears, that Capital Humano holds about 59,8%, and that the foot of the page names `credito-anual-2025.zip` with its date.

- [ ] **Step 6: Commit**

```bash
git add site/index.html site/estilo.css site/app/pantalla.js site/app/app.js \
        test/pantalla.test.mjs test/falso-documento.mjs
git commit -m "Draw the screen of the root"
```

---

### Task 10: The screen of a nodo, and the screen of a camino that is absent

**Files:**
- Modify: `site/app/pantalla.js`
- Modify: `site/app/app.js`
- Test: `test/pantalla.test.mjs`

**Interfaces:**
- Consumes: every module of tasks 1 to 8.
- Produces: `vistaDeNodo(estado, clave) -> vista`; `vistaDeAusente(estado, clave, origen) -> vista`; `dibujarNodo(vista, documento)`; `dibujarAusente(vista, documento)`; `indiceParaClave(ejercicio, indice, clave) -> Promise<indice>`.

**Two facts of the contract that this task must honour.**

A nodo of level 9 declares its children of the object in `k`, and those children live in `objeto/<clave de 9 codigos>.json`. Verified against the real data: the nodo `1-0-0-312-16-0-0-1-0` holds `k` of `["1","2","3","4","5"]`, and the object file holds exactly those five incisos. `indiceParaClave` loads that file and joins it with the institutional index when the visitor crosses that level.

**The visitor never lands on a nodo with one child.** When a slice leads to a chain, `saltarHijoUnico` gives the first nodo that divides, and the names on the way go to the miga de pan.

- [ ] **Step 1: Write the failing test**

Add to `test/pantalla.test.mjs`:

```javascript
import { dibujarAusente, dibujarNodo, vistaDeAusente, vistaDeNodo }
  from "../site/app/pantalla.js";

const CON_CADENA = {
  ...ESTADO,
  indice: {
    "45": { n: "Procuracion", d: 31, p: 30, v: 33, g: 30, k: ["1"] },
    "45-1": { n: "Procuracion", d: 31, p: 30, v: 33, g: 30, k: ["0"] },
    "45-1-0": { n: "Defensa Juridica", d: 31, p: 30, v: 33, g: 30, k: ["7", "8"] },
    "45-1-0-7": { n: "Curso", d: 20, p: 20, v: 21, g: 20, k: [] },
    "45-1-0-8": { n: "Taller", d: 11, p: 10, v: 12, g: 10, k: [] },
  },
};

test("el nodo muestra su parte del total nacional", () => {
  const vista = vistaDeNodo(ESTADO, "88");
  assert.equal(vista.total, 60);
  assert.ok(Math.abs(vista.parteDelTotal - 0.6) < 1e-9);
});

test("la miga conserva los tramos que el navegador saltea", () => {
  const vista = vistaDeNodo(CON_CADENA, "45-1-0");
  assert.deepEqual(vista.miga.map((t) => t.nombre),
    ["Procuracion", "Procuracion", "Defensa Juridica"]);
});

test("la hoja muestra los codigos exactos al pie", () => {
  const vista = vistaDeNodo(CON_CADENA, "45-1-0-7");
  assert.equal(vista.procedencia.codigos.length, 4);
});

test("un nodo con gasto cero lo dice y no dibuja torta", () => {
  const cero = { ...ESTADO, indice: { "9": { n: "Sin ejecucion", d: 0, p: 0, v: 0, g: 0, k: [] } } };
  const vista = vistaDeNodo(cero, "9");
  assert.equal(vista.total, 0);
  assert.deepEqual(vista.porciones, []);
  assert.equal(vista.sinEjecucion, true);
});

test("abajo del nivel de control la desviacion cambia de nombre", () => {
  const vista = vistaDeNodo(CON_CADENA, "45-1-0-7");
  assert.equal(vista.desviacion.tipo, "sobre-lo-aprobado");
  const hondo = { ...ESTADO, indice: {
    "1-2-3-4-5-6-7-8": { n: "Actividad", d: 12, p: 10, v: 13, g: 11, k: [] } } };
  assert.equal(vistaDeNodo(hondo, "1-2-3-4-5-6-7-8").desviacion.tipo,
    "reasignacion-interna");
});

test("el camino ausente dice que no existe y ofrece dos salidas", () => {
  const vista = vistaDeAusente(ESTADO, "88-9-9", { ejercicio: 2024, monto: 12 });
  assert.equal(vista.clavePedida, "88-9-9");
  assert.equal(vista.ancestro, "88", "the nearest ancestor that exists");
  assert.equal(vista.origen.ejercicio, 2024);
});

test("la pantalla del ausente nombra el ejercicio y las dos salidas", () => {
  const vista = vistaDeAusente(ESTADO, "88-9-9", { ejercicio: 2024, monto: 12 });
  const texto = textoDe(dibujarAusente(vista, falsoDocumento()));
  assert.match(texto, /2025/);
  assert.match(texto, /2024/);
});
```

- [ ] **Step 2: Run the test and see it fail**

Run: `node --test test/pantalla.test.mjs`
Expected: FAIL with `SyntaxError` or `is not a function`.

- [ ] **Step 3: Write the implementation**

Add to `site/app/pantalla.js`:

```javascript
import { hijosDe, migaDePan, nivelDe, NIVELES_INSTITUCIONALES } from "./arbol.js";
import { cargarObjeto } from "./datos.js";
import { ancestroQueExiste } from "./ruta.js";

export async function indiceParaClave(ejercicio, indice, clave) {
  // A nodo of level 9 declares its children of the object in `k`, and those
  // children live in one file per leaf. Load that file when the visitor
  // reaches or passes that level, and join it with the institutional index.
  if (nivelDe(clave) < NIVELES_INSTITUCIONALES) {
    return indice;
  }
  const hoja = clave.split("-").slice(0, NIVELES_INSTITUCIONALES).join("-");
  const objeto = await cargarObjeto(ejercicio, hoja);
  return { ...indice, ...objeto };
}

export function vistaDeNodo(estado, clave) {
  const { indice, entrada, ejercicio, disponibles } = estado;
  const nodo = indice[clave];
  const hijos = hijosDe(indice, clave);
  const { total, porciones } = hijos.length > 0
    ? porcionesDe(indice, hijos, "d")
    : { total: nodo.d, porciones: [] };
  const raizTotal = totalDe(indice, raices(indice), "d");
  return {
    ejercicio,
    anios: disponibles,
    clave,
    titulo: nodo.n,
    total: nodo.d,
    parteDelTotal: raizTotal > 0 ? nodo.d / raizTotal : null,
    ejecucion: ejecucionDe(nodo),
    desviacion: desviacionDe(nodo, clave),
    miga: migaDePan(indice, clave),
    porciones: total > 0 ? porciones : [],
    sinEjecucion: nodo.d === 0,
    procedencia: procedenciaDe(entrada, indice, clave),
  };
}

export function vistaDeAusente(estado, clave, origen) {
  return {
    ejercicio: estado.ejercicio,
    anios: estado.disponibles,
    clavePedida: clave,
    nombre: origen.nombre ?? clave.split("-").at(-1),
    origen,
    ancestro: ancestroQueExiste(estado.indice, clave),
    procedencia: procedenciaDe(estado.entrada, estado.indice, ""),
  };
}
```

```javascript
const PALABRA_DE_LA_DESVIACION = {
  "sobre-lo-aprobado": "sobre lo aprobado",
  "reasignacion-interna": "de reasignación dentro del proyecto",
};

export function dibujarNodo(vista, documento = document) {
  const seccion = documento.createElement("section");
  seccion.setAttribute("class", "pantalla pantalla-nodo");
  seccion.appendChild(dibujarTiraDeAnios(vista, documento));

  const miga = documento.createElement("nav");
  miga.setAttribute("class", "miga");
  miga.setAttribute("aria-label", "Camino");
  const inicio = texto(documento, "button", "Inicio", "tramo");
  inicio.setAttribute("data-clave", "");
  miga.appendChild(inicio);
  for (const tramo of vista.miga) {
    const paso = texto(documento, "button", tramo.nombre, "tramo");
    paso.setAttribute("data-clave", tramo.clave);
    miga.appendChild(paso);
  }
  seccion.appendChild(miga);

  seccion.appendChild(texto(documento, "h1", vista.titulo));

  const cifra = documento.createElement("p");
  cifra.setAttribute("class", "total");
  cifra.textContent = `${montoLargo(vista.total)} pesos`;
  seccion.appendChild(cifra);

  const detalle = [];
  if (vista.parteDelTotal !== null) {
    detalle.push(`${porcentaje(vista.parteDelTotal)} del gasto total`);
  }
  if (vista.ejecucion !== null) {
    detalle.push(`${porcentaje(vista.ejecucion)} de lo autorizado`);
  }
  if (vista.desviacion) {
    const palabra = PALABRA_DE_LA_DESVIACION[vista.desviacion.tipo];
    detalle.push(`${conSigno(vista.desviacion.valor)} ${palabra}`);
  }
  seccion.appendChild(texto(documento, "p", detalle.join(" · "), "detalle"));

  if (vista.sinEjecucion) {
    seccion.appendChild(texto(documento, "p",
      "Sin ejecución en este ejercicio.", "sin-ejecucion"));
  } else {
    seccion.appendChild(dibujarTorta(vista.porciones, documento));
    const leyenda = documento.createElement("ul");
    leyenda.setAttribute("class", "leyenda");
    vista.porciones.forEach((porcion, orden) => {
      const fila = texto(documento, "li",
        `${porcion.nombre} · ${porcentaje(porcion.parte)} · ${montoCorto(porcion.monto)}`,
        `leyenda-${orden}`);
      fila.setAttribute("data-destino", porcion.destino.join(" "));
      leyenda.appendChild(fila);
    });
    seccion.appendChild(leyenda);
  }

  seccion.appendChild(dibujarProcedencia(vista.procedencia, documento));
  return seccion;
}

export function dibujarAusente(vista, documento = document) {
  const seccion = documento.createElement("section");
  seccion.setAttribute("class", "pantalla pantalla-ausente");
  seccion.appendChild(dibujarTiraDeAnios(vista, documento));

  seccion.appendChild(texto(documento, "h1",
    `"${vista.nombre}" no existe en el ejercicio ${vista.ejercicio}`));

  if (vista.origen && vista.origen.monto !== undefined) {
    seccion.appendChild(texto(documento, "p",
      `Existió en ${vista.origen.ejercicio}, con ${montoCorto(vista.origen.monto)} de pesos.`,
      "origen"));
  }

  if (vista.ancestro) {
    const subir = texto(documento, "button", "Subir al nivel que sí existe",
      "principal");
    subir.setAttribute("data-clave", vista.ancestro);
    seccion.appendChild(subir);
  }
  const volver = texto(documento, "button",
    `Volver a ${vista.origen.ejercicio}`, "secundario");
  volver.setAttribute("data-anio", String(vista.origen.ejercicio));
  volver.setAttribute("data-clave", vista.clavePedida);
  seccion.appendChild(volver);

  seccion.appendChild(dibujarProcedencia(vista.procedencia, documento));
  return seccion;
}
```

**The deviation takes the word of its type.** `PALABRA_DE_LA_DESVIACION` is the one place where the two concepts turn into two sentences, so no screen can show one and name it the other.

In `site/app/app.js`, route on the clave:

- Read the route. Load the manifest, the institutional file, and then `indiceParaClave`.
- When the clave is empty, draw the root.
- When the clave exists in the index, draw the nodo.
- When it does not, draw the absent screen, and carry the exercise the visitor came from.
- On a click of a slice or a legend row, read `data-destino`. One destino goes to `saltarHijoUnico` and then to the route of that nodo. Several destinos mean the slice "otros": keep them in the state and draw the pie chart of that group, with the miga de pan showing `otros`.

- [ ] **Step 4: Run the test and see it pass**

Run: `node --test test/pantalla.test.mjs`
Expected: PASS, 12 tests in this file.

- [ ] **Step 5: See it in a browser**

Serve `site/` and walk down from Capital Humano to an inciso. Confirm that no screen on the way shows one slice of 100%, that the miga de pan holds every name, and that the last screen shows the codes at the foot.

Then press the arrow of the year from a deep nodo of 2025 and confirm the screen of the absent camino appears with its two exits.

- [ ] **Step 6: Commit**

```bash
git add site/app/pantalla.js site/app/app.js test/pantalla.test.mjs
git commit -m "Draw the screen of a nodo and the screen of a camino that is absent"
```

---

### Task 11: The screen of the sources and the method

This is the screen that answers "should I believe any of this". It is static and it is short.

**Files:**
- Modify: `site/app/pantalla.js`
- Modify: `site/app/app.js`
- Test: `test/pantalla.test.mjs`

**Interfaces:**
- Produces: `vistaDeFuentes(manifiesto) -> vista`; `dibujarFuentes(vista, documento)`.

- [ ] **Step 1: Write the failing test**

Add to `test/pantalla.test.mjs`:

```javascript
import { dibujarFuentes, vistaDeFuentes } from "../site/app/pantalla.js";

const MANIFIESTO = { ejercicios: [
  { ejercicio: 2024, archivo: "https://x/credito-anual-2024.zip",
    publicado: "Fri, 04 Jul 2025 10:44:09 GMT", verificado: true,
    en_este_artefacto: true },
  { ejercicio: 2025, archivo: "https://x/credito-anual-2025.zip",
    publicado: "Wed, 08 Jul 2026 10:39:43 GMT", verificado: true,
    en_este_artefacto: true },
] };

test("las fuentes listan un ejercicio por fila con su fecha", () => {
  const vista = vistaDeFuentes(MANIFIESTO);
  assert.equal(vista.filas.length, 2);
  assert.equal(vista.filas[0].ejercicio, 2024);
  assert.equal(vista.filas[0].verificado, true);
});

test("la pantalla nombra la licencia y el organismo", () => {
  const texto = textoDe(dibujarFuentes(vistaDeFuentes(MANIFIESTO), falsoDocumento()));
  assert.match(texto, /CC BY 4\.0/);
  assert.match(texto, /Ministerio de Economía/);
  assert.match(texto, /credito-anual-2025\.zip/);
});
```

- [ ] **Step 2: Run the test and see it fail**

Run: `node --test test/pantalla.test.mjs`
Expected: FAIL with `is not a function`.

- [ ] **Step 3: Write the implementation**

```javascript
const REPOSITORIO = "https://github.com/elranu/enquelagastan";

export function vistaDeFuentes(manifiesto) {
  return {
    filas: manifiesto.ejercicios.map((entrada) => ({
      ejercicio: entrada.ejercicio,
      archivo: entrada.archivo,
      publicado: entrada.publicado,
      verificado: entrada.verificado === true,
    })),
  };
}

export function dibujarFuentes(vista, documento = document) {
  const seccion = documento.createElement("section");
  seccion.setAttribute("class", "pantalla pantalla-fuentes");
  seccion.appendChild(texto(documento, "h1", "De dónde salen estos números"));

  seccion.appendChild(texto(documento, "p",
    "Los datos son de Presupuesto Abierto, del Ministerio de Economía de la "
    + "Nación, bajo licencia CC BY 4.0. Este proyecto lee los mismos archivos "
    + "que ofrece la página oficial de datos abiertos. Las URLs son idénticas."));

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
    linea.appendChild(texto(documento, "td", fila.publicado));
    linea.appendChild(texto(documento, "td",
      fila.verificado ? "verificado" : "sin verificar"));
    tabla.appendChild(linea);
  }
  seccion.appendChild(tabla);

  seccion.appendChild(texto(documento, "p",
    "En cada corrida, el build suma el total del ejercicio y lo compara con el "
    + "informe oficial Cuenta Ahorro Inversión Financiamiento. Si los dos no "
    + "coinciden, no publica nada."));

  const codigo = texto(documento, "a", "El código de este proyecto");
  codigo.setAttribute("href", REPOSITORIO);
  seccion.appendChild(codigo);
  return seccion;
}
```

Add a link to that screen in the foot of every other screen, and route `#/fuentes` to it in `app.js`.

- [ ] **Step 4: Run the test and see it pass**

Run: `node --test test/pantalla.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add site/app/pantalla.js site/app/app.js test/pantalla.test.mjs
git commit -m "Draw the screen of the sources and the method"
```

---

### Task 12: Make it readable, and run the tests in the workflow

**Files:**
- Modify: `site/estilo.css`
- Modify: `.github/workflows/build.yml`
- Modify: `README.md`

- [ ] **Step 1: Run the tests of the front end in the workflow**

Add to `.github/workflows/build.yml`, before the step that builds:

```yaml
      - uses: actions/setup-node@v4
        with:
          node-version: "22"

      - name: Run the tests of the navigator
        run: node --test test/
```

The step must run before the build, so a navigator that fails its tests never reaches the publication.

- [ ] **Step 2: Refine the style**

Use the skills of design that this machine holds: `better-layout` for the reading order and the grouping, `better-typography` for the scale of type, and `better-ui` for the hit areas and the surfaces. Read them before you touch the CSS.

Hold these, which come from the design and are not a matter of taste:

- **The first level shows one slice of 59,8%.** The chart is a headline and not a graph, so give it room and do not crowd it with labels.
- **Every slice is a target for a finger.** The smallest slice on a real screen is about 1% of the circle. Give the legend row the same `data-destino`, so the legend is the reliable target and the chart is the picture.
- **The source line sits at the foot of every screen and is always visible.** It is not a detail. It is invariant INV-03 and the reason the product can be believed.
- The copy is in Spanish. The page declares `lang="es"`.

- [ ] **Step 3: Check the accessibility**

Read `better-accessibility` first. Then confirm by hand:

- Every control reaches focus with the keyboard, and the focus ring is visible.
- The pie chart carries a text alternative: each slice holds a `title`, and the legend gives the same information as text.
- The contrast of every pair of colours meets AA.
- A screen reader reads the miga de pan as a list, and the year strip as a navigation.

Write what you checked and what you found in the report of the task.

- [ ] **Step 4: Update the README**

The README says today that the screens do not exist. They exist now. Rewrite the section `What this project is today`, and say where the site lives. Keep the section that shows a reader how to check a number by hand, because it is the strongest thing the project offers.

- [ ] **Step 5: Run everything**

```bash
node --test test/
python -m unittest discover -s tests -v
python -m build --destino site/data
python3 -m http.server 8000 --directory site
```

- [ ] **Step 6: Commit**

```bash
git add site/estilo.css .github/workflows/build.yml README.md
git commit -m "Make the navigator readable, and test it in the workflow"
```

---

## What this plan leaves for the next one

| Item | Why it waits |
|---|---|
| P3, the screen of the fiscal result | It needs the revenue of the exercise, and the build produces none. `url_recursos` has no caller. The third plan adds the revenue to the build and then draws P3, which is small once the data arrives. |
| The button that removes the inflation | Deferred by the user. ADR 0001 makes it a small change: every `Monto` carries its exercise. |
| The alerts | Out of scope of the design spec. The endpoint of the catalog is the piece that will serve them. |
| The deploy that keeps the last published site | An exercise that fails a check loses its files from the site that day. The navigator now hides it, because `en_este_artefacto` says so, but the repair belongs to the deploy. |

## Open questions that this plan answers

| # | Question | Answer |
|---|---|---|
| Q6 | Does the deviation need a colour, or is the sign enough? | Task 12 decides it with the skills of design. |
| Q7 | How does the miga de pan behave on a telephone when the camino is long? | Task 12. |

## Open questions that stay open

Q1 to Q4, Q8 to Q11 of the design spec. None of them blocks this plan.
