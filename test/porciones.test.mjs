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
