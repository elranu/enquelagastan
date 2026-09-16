import test from "node:test";
import assert from "node:assert/strict";

import {
  conSigno, fechaCorta, montoCorto, montoLargo, pesosDe, porcentaje,
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
  // The value 1.2 gives "1,2 millones". The brief's original literal,
  // 1_200, is 1.200 millones de pesos and gives "1.200,0 millones".
  assert.equal(montoCorto(1.2), "1,2 millones");
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

test("la fecha se lee en español y no como un encabezado HTTP", () => {
  assert.equal(fechaCorta("Wed, 08 Jul 2026 10:39:43 GMT"), "8 jul 2026");
  assert.equal(fechaCorta("Fri, 04 Jul 2025 10:44:09 GMT"), "4 jul 2025");
});

test("una fecha que no se entiende pasa como vino", () => {
  // A wrong date is worse than an English one, and "Invalid Date" says
  // nothing to anybody.
  assert.equal(fechaCorta("ayer a la tarde"), "ayer a la tarde");
  assert.equal(fechaCorta(undefined), "");
  assert.equal(fechaCorta(""), "");
});
