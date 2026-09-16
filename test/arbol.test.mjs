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
  assert.equal(saltarHijoUnico(INDICE, "45"), "45-1-0");
});

test("no salta cuando el nodo ya divide", () => {
  assert.equal(saltarHijoUnico(INDICE, "88"), "88");
});

test("la miga junta los nombres repetidos en un solo tramo", () => {
  // DGSIAF repeats the name of the parent at every code 0. Three chips that
  // all read "Defensa" say nothing, and the style cuts them at the same
  // width. One chip stays, and it points at the shallowest clave.
  const miga = migaDePan(INDICE, "45-1-0-7");
  assert.deepEqual(miga.map((t) => t.clave), ["45", "45-1-0-7"]);
  assert.deepEqual(miga.map((t) => t.nombre), ["Defensa", "Curso"]);
});

test("la miga conserva un nombre repetido que no es adyacente", () => {
  const indice = {
    "1": { n: "A", k: ["2"] },
    "1-2": { n: "B", k: ["3"] },
    "1-2-3": { n: "A", k: [] },
  };
  assert.deepEqual(migaDePan(indice, "1-2-3").map((t) => t.nombre),
    ["A", "B", "A"]);
});

test("el total suma la medida que se pide", () => {
  assert.equal(totalDe(INDICE, raices(INDICE), "d"), 97);
  assert.equal(totalDe(INDICE, raices(INDICE), "p"), 80);
});
