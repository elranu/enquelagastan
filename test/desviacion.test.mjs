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
